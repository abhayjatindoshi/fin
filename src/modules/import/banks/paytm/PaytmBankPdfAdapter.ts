import type { AccountDetails, ImportData, TransactionDetails } from "../../interfaces/ImportData";
import type { IPdfFile, IPdfImportAdapter } from "../../interfaces/IPdfImportAdapter";

export class PaytmBankPdfAdapter implements IPdfImportAdapter {
    id = '';
    fileType: "pdf" = "pdf";
    type: "file" = "file";

    // Account details patterns - supports both table format and vertical list format
    private accountNumberTableHeaderRegex = /^ACCOUNT[\s]+NUMBER[\s]+ACCOUNT[\s]+TYPE[\s]+IFSC/i;
    private accountNumberLabelRegex = /^ACCOUNT[\s]+NUMBER$/i;
    private accountNumberRegex = /(\d{9,})/;

    // Transaction patterns
    private dateRegex = /^(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})$/i;
    private timeRegex = /^(\d{1,2}:\d{2})\s*(AM|PM)$/i;
    // Supports both "Rs." and "₹" currency symbols, with or without spaces
    private transactionAmountRegex = /^([+-])\s*(?:Rs\.|₹)\s*(\d{1,3}(?:,\d{2,3})*(?:\.\d{2})?)\s+(?:Rs\.|₹)\s*(\d{1,3}(?:,\d{2,3})*(?:\.\d{2})?)$/;

    // Skip patterns for footer lines
    private skipLinesAfter = [
        /^\*[\s]*Visit[\s]+Bank/i,
        /^\*[\s]*PPBL[\s]+Savings/i,
        /^This[\s]+statement[\s]+contains/i,
        /^To[\s]+view[\s]+terms/i,
        /^PPBL[\s]+Savings/i,
        /^Each[\s]+depositor/i,
        /^Need[\s]+Help/i,
        /^\*{4,}/i,
        /^Page[\s]+\d+/i,
    ];

    // Header pattern to skip
    private headerRegex = /^DATE[\s]+&[\s]+TIME[\s]+TRANSACTION[\s]+DETAILS/i;

    isSupported(file: IPdfFile): boolean {
        return file.pages.some(page => page.some(line => line.includes('PPBL')));
    }

    async read(file: IPdfFile): Promise<ImportData> {
        const account = this.extractAccountDetails(file.pages);
        const accountNumber = account.accountNumber?.[0];
        if (!accountNumber) throw new Error('Unable to extract account number from Paytm PDF file.');

        const transactions = this.extractTransactions(file.pages);

        return {
            account,
            transactions,
        }
    }

    extractAccountDetails(pages: string[][]): AccountDetails {
        for (const page of pages) {
            for (let i = 0; i < page.length; i++) {
                // Check for table format: "ACCOUNT NUMBER   ACCOUNT TYPE   IFSC   MICR..."
                if (this.accountNumberTableHeaderRegex.test(page[i])) {
                    if (i + 1 < page.length) {
                        const detailsLine = page[i + 1];
                        const parts = detailsLine.split(/\s{2,}/); // Split by 2+ spaces

                        if (parts.length >= 4) {
                            const accountNumber = parts[0].match(this.accountNumberRegex)?.[1];
                            const ifscCode = parts[2];
                            const micrCode = parts[3];

                            return {
                                accountNumber: accountNumber ? [accountNumber] : [],
                                ifscCode: ifscCode ? [ifscCode] : [],
                                micrCode: micrCode ? [micrCode] : [],
                            };
                        }
                    }
                }

                // Check for vertical list format: "ACCOUNT NUMBER" on its own line
                if (this.accountNumberLabelRegex.test(page[i])) {
                    // Look for account number on next line
                    if (i + 1 < page.length) {
                        const accountNumberMatch = page[i + 1].match(this.accountNumberRegex);
                        if (accountNumberMatch) {
                            const accountNumber = accountNumberMatch[1];
                            let ifscCode: string | undefined;
                            let micrCode: string | undefined;

                            // Look for IFSC and MICR in subsequent lines
                            for (let j = i + 2; j < Math.min(i + 12, page.length); j++) {
                                if (/^IFSC$/i.test(page[j]) && j + 1 < page.length) {
                                    ifscCode = page[j + 1];
                                }
                                if (/^MICR$/i.test(page[j]) && j + 1 < page.length) {
                                    micrCode = page[j + 1];
                                }
                            }

                            return {
                                accountNumber: [accountNumber],
                                ifscCode: ifscCode ? [ifscCode] : [],
                                micrCode: micrCode ? [micrCode] : [],
                            };
                        }
                    }
                }
            }
        }

        return {};
    }

    public extractTransactions(pages: string[][]): TransactionDetails[] {
        const cleanedLines = this.removeHeaderAndFooterLines(pages);
        return this.parseTransactions(cleanedLines);
    }

    private parseTransactions(lines: string[]): TransactionDetails[] {
        const transactions: TransactionDetails[] = [];
        let i = 0;

        while (i < lines.length) {
            // Look for date line
            const dateMatch = lines[i].match(this.dateRegex);
            if (!dateMatch) {
                i++;
                continue;
            }

            const dateLine = lines[i];
            i++;

            // Expect time line next
            if (i >= lines.length) break;
            const timeMatch = lines[i].match(this.timeRegex);
            if (!timeMatch) continue;
            const timeLine = lines[i];
            i++;

            // Parse date and time
            const date = this.parseDateTime(dateLine, timeLine);
            date.setMilliseconds(date.getMilliseconds() + transactions.length); // ensure transaction order

            // Collect all lines until we find the amount line
            const descriptionParts: string[] = [];
            let amountLine: string | null = null;

            while (i < lines.length) {
                const line = lines[i];

                // Check if this is the amount line
                const amountMatch = line.match(this.transactionAmountRegex);
                if (amountMatch) {
                    amountLine = line;
                    i++;
                    break;
                }

                // Check if we've hit the next transaction (new date)
                if (this.dateRegex.test(line)) {
                    break;
                }

                descriptionParts.push(line);
                i++;
            }

            if (!amountLine) continue;

            // Parse amount line: "+   Rs.5,000.00   Rs.6,105.40" or "-   Rs.2,609.20   Rs.1,105.40"
            const amountParsed = amountLine.match(this.transactionAmountRegex);
            if (!amountParsed) continue;

            const sign = amountParsed[1];
            const amountStr = amountParsed[2].replace(/,/g, '');
            let amount = parseFloat(amountStr);

            if (isNaN(amount)) continue;

            // Apply sign
            if (sign === '-') {
                amount = -Math.abs(amount);
            } else {
                amount = Math.abs(amount);
            }

            // Check for description line after amount (Sent to: / Received from: / Paid successfully at / etc.)
            if (i < lines.length && !this.dateRegex.test(lines[i]) && !this.transactionAmountRegex.test(lines[i])) {
                descriptionParts.push(lines[i]);
                i++;
            }

            // Build description by joining all parts
            const description = descriptionParts.join(' ');

            transactions.push({
                date,
                amount,
                description
            });
        }

        return transactions;
    }

    private parseDateTime(dateLine: string, timeLine: string): Date {
        const dateMatch = dateLine.match(this.dateRegex);
        const timeMatch = timeLine.match(this.timeRegex);

        if (!dateMatch || !timeMatch) {
            throw new Error(`Invalid date/time format: ${dateLine} ${timeLine}`);
        }

        const day = parseInt(dateMatch[1], 10);
        const monthStr = dateMatch[2];
        const year = parseInt(dateMatch[3], 10);

        const months: Record<string, number> = {
            'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
            'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
        };
        const month = months[monthStr.toLowerCase()];

        const [hourStr, minuteStr] = timeMatch[1].split(':');
        let hour = parseInt(hourStr, 10);
        const minute = parseInt(minuteStr, 10);
        const ampm = timeMatch[2].toUpperCase();

        if (ampm === 'PM' && hour !== 12) {
            hour += 12;
        } else if (ampm === 'AM' && hour === 12) {
            hour = 0;
        }

        return new Date(year, month, day, hour, minute);
    }

    private removeHeaderAndFooterLines(pages: string[][]): string[] {
        const cleanedLines: string[] = [];

        for (const page of pages) {
            for (let i = 0; i < page.length; i++) {
                const line = page[i];

                // Skip header line
                if (this.headerRegex.test(line)) continue;

                // Skip footer lines
                if (this.skipLinesAfter.some(regex => regex.test(line))) continue;

                // Skip empty lines
                if (line.trim() === '') continue;

                cleanedLines.push(line);
            }
        }

        return cleanedLines;
    }
}
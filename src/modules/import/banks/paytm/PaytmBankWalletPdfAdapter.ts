import type { AccountDetails, ImportData, TransactionDetails } from "../../interfaces/ImportData";
import type { IPdfFile, IPdfImportAdapter } from "../../interfaces/IPdfImportAdapter";

export class PaytmBankWalletPdfAdapter implements IPdfImportAdapter {
    id = '';
    fileType: "pdf" = "pdf";
    type: "file" = "file";

    // Account details patterns - supports both table format and vertical list format
    private walletAccountNumberRegex = /(\+\d{1,3}-\d{10})/;
    // Holder name: ALL-CAPS full name (2+ words) on the line immediately before the phone number
    private holderNameRegex = /^([A-Z][A-Z\s]+[A-Z])$/;

    // Transaction patterns
    private timeRegex = /^(\d{1,2}:\d{2})\s*(AM|PM)$/i;
    // Wallet format: only transaction amount (not balance) - Supports both "Rs." and "₹" currency symbols
    private transactionAmountRegex = /^([+-])\s*(?:Rs\.|₹)\s*(\d{1,3}(?:,\d{2,3})*(?:\.\d{2})?)$/;
    // Combined format: amount + description + balance + date all in one line
    // Example: "- Rs.614.02 Paid for order to McD Kilpauk   Rs.0 25 DEC 21"
    private transactionCombinedRegex = /^([+-])\s*Rs\.\s*(\d{1,3}(?:,\d{2,3})*(?:\.\d{2})?)\s+(.+?)\s+Rs\.\s*\d{1,3}(?:,\d{2,3})*(?:\.\d{2})?\s+(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2,4})$/i;

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

    // Skip patterns for header and metadata lines
    private skipHeaderLines = [
        /^DATE[\s]+&[\s]+TIME[\s]+TRANSACTION[\s]+DETAILS[\s]+(?:AVAILABLE|CLOSING)[\s]+BALANCE/i,
        /^TRANSACTION DETAILS$/i,
        /^AVAILABLE BALANCE$/i,
        /^CLOSING BALANCE$/i,
        /^AMOUNT$/i,
        /^Opening Balance/i,
        /^Closing Balance/i,
        /^Expenses\/Transfer/i,
        /^Cashback$/i,
        /^Added\/Received/i,
        /^Refund$/i,
        /^Combined Wallet/i,
        /^Balance as on/i,
        /^as on\s+as on$/i,
        /^Wallet statement for/i,
        /^(?:Paytm )?(?:Wallet|Balance) statement for/i,
        /^Rs\.$/i,
        /^₹$/i,
        /^\d+$/, // standalone numbers
        /^\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}$/i,
        /^[\d,]+\.\d{2}\s+Rs\.$/i,
        /^\d+\s+Rs\.[\d,]+\.\d{2}$/i,
        /cKYC ID/i,
        /^\+\d{1,3}-\d{10}$/,
        /@(?!.*Transaction ID)/i, // Email addresses but not transaction IDs
        /^[A-Z][\d]+,.*(?:Sector|Pradesh|Towers|Building|Floor|Noida|India)/i, // Address lines
    ];

    private skipDescriptionTexts = [
        /Money (?:Sent|Received) using UPI/i,
        /Paid using your Bank Account From/i,
        /Paid using your Bank Account/i,
        /Money (?:Sent|Received) using IMPS Bank account linked to/i,
        /Money (?:Sent|Received) using IMPS/i,
        /Money (?:Sent|Received) via UPI/i,
        /Interest Received/i,
    ]

    isSupported(file: IPdfFile): boolean {
        return file.pages.some(page => page.some(line => line.includes('Paytm') || line.includes("PPBL"))) &&
            file.pages.some(page => page.some(line => line.toLowerCase().includes('wallet statement') || line.toLowerCase().includes('balance statement')));
    }

    async read(file: IPdfFile): Promise<ImportData> {
        const account = this.extractAccountDetails(file.pages);
        const accountNumber = account.accountNumber?.[0];
        if (!accountNumber) throw new Error('Unable to extract account number from Paytm PDF file.');

        const transactions = this.extractTransactions(file.pages);

        return {
            account,
            transactions,
        };
    }

    extractAccountDetails(pages: string[][]): AccountDetails {
        for (const page of pages) {
            for (let i = 0; i < page.length; i++) {
                if (this.walletAccountNumberRegex.test(page[i])) {
                    const accountNumberMatch = page[i].match(this.walletAccountNumberRegex);
                    if (accountNumberMatch) {
                        const accountNumber = accountNumberMatch[1].replaceAll(/[^0-9]/g, '');
                        // Holder name is on the line immediately before the phone number
                        const holderName = i > 0 && this.holderNameRegex.test(page[i - 1].trim())
                            ? page[i - 1].trim()
                            : undefined;
                        return {
                            accountNumber: [accountNumber],
                            ...(holderName && { accountHolderName: [holderName] }),
                        };
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
            // Look for time line (transactions start with time in wallet statements)
            const timeMatch = lines[i].match(this.timeRegex);
            if (!timeMatch) {
                i++;
                continue;
            }

            const timeLine = lines[i];
            i++;

            if (i >= lines.length) break;

            // Check for combined format first (amount + description + balance + date in one line)
            const combinedMatch = lines[i].match(this.transactionCombinedRegex);
            if (combinedMatch) {
                const sign = combinedMatch[1];
                const amountStr = combinedMatch[2].replace(/,/g, '');
                let amount = parseFloat(amountStr);
                const description = combinedMatch[3].trim();
                const dateLine = combinedMatch[4];

                if (!isNaN(amount)) {
                    // Apply sign
                    if (sign === '-') {
                        amount = -Math.abs(amount);
                    } else {
                        amount = Math.abs(amount);
                    }

                    // Parse date and time
                    const date = this.parseDateTime(dateLine, timeLine);
                    date.setMilliseconds(date.getMilliseconds() + transactions.length);

                    // Clean up description
                    let cleanDescription = description.replaceAll(/\s+/g, ' ').trim();
                    for (const skipRegex of this.skipDescriptionTexts) {
                        cleanDescription = cleanDescription.replace(skipRegex, '').trim();
                    }

                    transactions.push({
                        date,
                        amount,
                        description: cleanDescription
                    });
                }

                i++;
                // Skip transaction ID line and optional Note line
                if (i < lines.length && /Transaction ID/i.test(lines[i])) {
                    i++;
                }
                if (i < lines.length && /^Note:/i.test(lines[i])) {
                    i++;
                }
                continue;
            }

            // Check for separated format (amount on its own line)
            const amountMatch = lines[i].match(this.transactionAmountRegex);
            if (amountMatch) {
                i++;

                // Parse amount from the amount line
                const sign = amountMatch[1];
                const amountStr = amountMatch[2].replace(/,/g, '');
                let amount = parseFloat(amountStr);

                if (isNaN(amount)) continue;

                // Apply sign
                if (sign === '-') {
                    amount = -Math.abs(amount);
                } else {
                    amount = Math.abs(amount);
                }

                // Collect description lines until we hit the next time line or end
                const descriptionParts: string[] = [];
                let dateLine: string | null = null;

                while (i < lines.length) {
                    const line = lines[i];

                    // Check if we've hit the next transaction (new time)
                    if (this.timeRegex.test(line)) {
                        break;
                    }

                    // Look for date embedded in the line (e.g., "Pvt Ltd   Rs.0 27 FEB 24")
                    const dateMatch = line.match(/(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2,4})/i);
                    if (dateMatch && !dateLine) {
                        dateLine = dateMatch[1];
                        // Add the part before the date to description
                        const beforeDate = line.substring(0, dateMatch.index).trim();
                        if (beforeDate) {
                            descriptionParts.push(beforeDate);
                        }
                    } else {
                        descriptionParts.push(line);
                    }

                    i++;
                }

                // If no date found, skip this transaction
                if (!dateLine) continue;

                // Parse date and time
                const date = this.parseDateTime(dateLine, timeLine);
                date.setMilliseconds(date.getMilliseconds() + transactions.length); // ensure transaction order

                // Build description by joining all parts
                let description = descriptionParts
                    .join(' ')
                    .replaceAll(/\s+/g, ' ')
                    .trim();

                // Remove any remaining "Rs.X" patterns that might be balance info
                description = description.replace(/Rs\.\s*\d{1,3}(?:,\d{2,3})*(?:\.\d{2})?/g, '').trim();

                for (const skipRegex of this.skipDescriptionTexts) {
                    description = description.replace(skipRegex, '').trim();
                }

                transactions.push({
                    date,
                    amount,
                    description
                });
                continue;
            }

            // No match, skip this line
            i++;
        }

        return transactions;
    }

    private parseDateTime(dateLine: string, timeLine: string): Date {
        // dateLine format: "27 FEB 24" or "27 Feb 2024"
        const dateMatch = dateLine.match(/(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{2,4})/i);
        const timeMatch = timeLine.match(this.timeRegex);

        if (!dateMatch || !timeMatch) {
            throw new Error(`Invalid date/time format: ${dateLine} ${timeLine}`);
        }

        const day = parseInt(dateMatch[1], 10);
        const monthStr = dateMatch[2];
        let year = parseInt(dateMatch[3], 10);

        // Handle 2-digit year format
        if (year < 100) {
            year += 2000;
        }

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

                // Skip header and metadata lines
                if (this.skipHeaderLines.some(regex => regex.test(line))) continue;

                // Check for footer patterns - skip remaining lines on this page
                if (this.skipLinesAfter.some(regex => regex.test(line))) {
                    break;
                }

                // Skip empty lines
                if (line.trim() === '') continue;

                cleanedLines.push(line);
            }
        }

        return cleanedLines;
    }
}
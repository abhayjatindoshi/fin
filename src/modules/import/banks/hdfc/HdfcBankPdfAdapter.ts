import type { ImportData, TransactionDetails } from "../../interfaces/ImportData";
import type { IPdfFile, IPdfImportAdapter } from "../../interfaces/IPdfImportAdapter";

export class HdfcBankPdfAdapter implements IPdfImportAdapter {
    id = '';
    type: 'file' = 'file';
    fileType: 'pdf' = 'pdf';

    private accountNumberLabelRegex = /Account[\s]+Number|Account[\s]+No/i;
    private accountNumberRegex = /(\d{10,})/;
    private hdfcIfscCodeRegex = /HDFC0\d{6,}/i;
    private hdfcIfscCodeLabelRegex = /RTGS\/NEFT[\s]+IFSC/i;
    private openingBalanceLabelRegex = /Opening[\s]+Balance/i;
    private amountRegex = /(\d{1,3}(?:,\d{2,3})+(?:\.\d+)?|\d+\.\d{2})/g;
    private dateStartRegex = /^(\d{1,2}\/\d{1,2}\/\d{2,4})\b/;
    private skipLinesAfter = [
        /^Page/i,
        /^STATEMENT[\s]+SUMMARY/i,
        /^Cr[\s]+Count/i,
        /^\*{2,}/i,
    ]

    private referenceNumberRegex = /^[\w]{12,25}$/i

    isSupported(file: IPdfFile): boolean {
        return file.pages.some(page => this.hdfcIfscCodeRegex.test(page.join(' ')) && this.hdfcIfscCodeLabelRegex.test(page.join(' ')));
    }

    async read(file: IPdfFile): Promise<ImportData> {

        const accountNumber = this.extractAccountNumber(file.pages);
        if (!accountNumber) throw new Error('Unable to extract account number from HDFC PDF file.');
        const transactions = this.extractTransactions(file.pages);

        return {
            account: {
                accountNumber: [accountNumber],
            },
            transactions
        }
    }

    public extractAccountNumber(pages: string[][]): string | null {
        for (const page of pages) {
            for (let i = 0; i < page.length; i++) {
                if (this.accountNumberLabelRegex.test(page[i])) {
                    while (!this.accountNumberRegex.test(page[i]) && i < page.length - 1) i++;
                    const match = page[i].match(this.accountNumberRegex);
                    if (match) return match[1];
                }
            }
        }
        return null;
    }

    private extractOpeningBalance(pages: string[][]): number | null {
        for (const page of pages) {
            for (let i = 0; i < page.length; i++) {
                if (!this.openingBalanceLabelRegex.test(page[i])) continue;
                while (i < page.length - 1) {
                    const matches = [...page[i].matchAll(this.amountRegex)].map(m => m[1]);
                    if (matches && matches.length > 0) {
                        return parseFloat(matches[0].replace(/,/g, ''));
                    }
                    i++;
                }
            }
        }
        return null;
    }

    public extractTransactions(pages: string[][]): TransactionDetails[] {
        const openingBalance = this.extractOpeningBalance(pages);
        if (openingBalance === null) throw new Error("Could not find opening balance in HDFC statement PDF.");
        const filteredPages = pages
            .filter(page => page.some(line => this.dateStartRegex.test(line)));
        const cleanedLines: string[] = this.removeHeaderAndFooterLines(filteredPages);
        const transactions = this.parseTransactions(cleanedLines, openingBalance);
        return transactions;
    }

    private parseTransactions(lines: string[], openingBalance: number): TransactionDetails[] {
        const transactions: TransactionDetails[] = [];
        let currentBalance = openingBalance;
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];

            // Find the date at the start of the line
            const dateMatch = line.match(this.dateStartRegex);
            if (!dateMatch) continue;

            // merge continuation lines
            let mergedLines = '';
            let found = false;
            const scanLimit = Math.min(10, lines.length - i);
            for (let j = 0; j < scanLimit; j++) {
                mergedLines += lines[i + j] + ' ';
                if ([...mergedLines.matchAll(this.amountRegex)].length >= 2) {
                    if (i + j == lines.length - 1 || this.dateStartRegex.test(lines[i + j + 1])) {
                        i += j;
                        line = mergedLines;
                        found = true;
                        break;
                    }
                }
            }
            if (!found) continue;

            // extract and parse date
            const dateStr = dateMatch[1];
            line = line.slice(dateStr.length)
            const date = this.parseDate(dateStr);
            date.setMilliseconds(date.getMilliseconds() + transactions.length); // ensure transaction order

            // extract amounts
            const amountMatches = [...line.matchAll(this.amountRegex)];
            if (amountMatches.length < 2) continue;

            // remove amount strings from line to isolate description
            for (let j = amountMatches.length - 1; j >= 0; j--) {
                const match = amountMatches[j];
                line = line.slice(0, match.index) + line.slice(match.index + match[0].length);
            }

            const balanceExec = amountMatches[amountMatches.length - 1];
            const balance = parseFloat(balanceExec[1].replaceAll(',', ''));

            let amount = 0;
            for (const amountExec of amountMatches.slice(0, amountMatches.length - 1)) {
                amount = parseFloat(amountExec[1].replaceAll(',', ''));
                if (amount != 0) break;
            }

            if (isNaN(balance) || isNaN(amount)) continue;

            if (balance < currentBalance) {
                amount = -Math.abs(amount);
            } else {
                amount = Math.abs(amount);
            }

            // check and extract reference number and value date if present
            // add it back to the line in end
            if (!/Value[\s]+Dt/.test(line)) {
                const firstAmountIndex = amountMatches[0].index;
                let split = line.slice(0, firstAmountIndex).split(' ').filter(part => part.trim() !== '');
                const valueDateIndex = split.findIndex(part => this.dateStartRegex.test(part));
                let suffix = '';
                if (valueDateIndex !== -1) {
                    const valueDate = this.parseDate(split[valueDateIndex]);
                    split = split.slice(0, valueDateIndex).concat(split.slice(valueDateIndex + 1));
                    suffix += ' Value Dt ' + (valueDate.getDate().toString().padStart(2, '0')) + '/' +
                        ((valueDate.getMonth() + 1).toString().padStart(2, '0')) + '/' +
                        (valueDate.getFullYear());
                }

                let refNumberIndex = split.findLastIndex(part => this.referenceNumberRegex.test(part));
                if (refNumberIndex === -1) {
                    refNumberIndex = split.findLastIndex(part => /^[0-9]{4,}$/.test(part));
                }
                if (refNumberIndex !== -1) {
                    const refNumber = split[refNumberIndex];
                    split = split.slice(0, refNumberIndex).concat(split.slice(refNumberIndex + 1));
                    if (/^[0-9]+$/.test(refNumber) && parseInt(refNumber) > 0) {
                        suffix += ' Ref ' + refNumber.replace(/^0+/, '');
                    }
                }

                line = split.join(' ') + ' ' + line.slice(firstAmountIndex) + suffix;
            }

            currentBalance = balance;
            line = line.replace(/\s+/g, ' ').trim();
            transactions.push({
                date,
                amount,
                description: line
            });
        }
        return transactions;
    }

    private parseDate(dateStr: string): Date {
        const parts = dateStr.split('/').map(part => parseInt(part, 10));
        const fullYear = parts[2] < 100 ? (parts[2] + 2000) : parts[2];
        return new Date(fullYear, parts[1] - 1, parts[0]);
    }

    private removeHeaderAndFooterLines(pages: string[][]): string[] {

        if (pages.length === 0) return [];

        const cleanedLines: string[] = [];
        for (const page of pages) {
            const headerLineIndex = page.findIndex(line => this.dateStartRegex.test(line));
            if (headerLineIndex === -1) return [];
            let footerLineIndex = page.length;
            for (let i = headerLineIndex; i < footerLineIndex; i++) {
                if (this.skipLinesAfter.some(regex => regex.test(page[i]))) {
                    footerLineIndex = i;
                    break;
                }
            }
            const contentLines = page.slice(headerLineIndex, footerLineIndex);
            cleanedLines.push(...contentLines);
        }
        return cleanedLines;
    }
}
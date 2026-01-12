import type { ImportData, TransactionDetails } from "../../interfaces/ImportData";
import type { IPdfFile, IPdfImportAdapter } from "../../interfaces/IPdfImportAdapter";

export class JupiterPdfAdapter implements IPdfImportAdapter {
    id = '';
    fileType: "pdf" = "pdf";
    type: "file" = "file";

    private accountNumberRegex = /Account[\s]+Number[\s]+(\d{10,})/i;
    private dateStartRegex = /^\d{1,2}\/\d{1,2}\/\d{2,4}.*/;
    private dateRegex = /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/g;
    private amountRegex = /(\d{1,}\.\d{2})/g;
    private skipLinesAfter = [
        /^Page/i,
        /^GRAND TOTAL/i,
    ]


    isSupported(file: IPdfFile): boolean {
        return file.pages.some(page => /Jupiter/i.test(page.join(' '))) &&
            file.pages.some(page => /Fintech Partnerships/.test(page.join(' ')));
    }

    async read(file: IPdfFile): Promise<ImportData> {
        const accountNumber = this.extractAccountNumber(file.pages);
        if (!accountNumber) throw new Error('Unable to extract account number from Jupiter PDF file.');

        const transactions = this.extractTransactions(file.pages);

        return {
            account: {
                accountNumber: [accountNumber]
            },
            transactions
        }

    }

    public extractAccountNumber(pages: string[][]): string | null {
        for (const page of pages) {
            for (let i = 0; i < page.length; i++) {
                if (this.accountNumberRegex.test(page[i])) {
                    const match = page[i].match(this.accountNumberRegex);
                    if (match) return match[1];
                }
            }
        }
        return null;
    }

    public extractTransactions(pages: string[][]): TransactionDetails[] {
        const cleanedLines: string[] = this.removeHeaderAndFooterLines(pages);
        const transactions = this.parseTransactions(cleanedLines);
        return transactions;
    }

    private parseTransactions(lines: string[]): TransactionDetails[] {
        const transactions: TransactionDetails[] = [];
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];

            // Find the date at the start of the line
            if (!this.dateStartRegex.test(line)) continue;

            // merge lines until we find a line that ends with an amount
            let mergedLines = '';
            let found = false;
            const scanLimit = Math.min(5, lines.length - i);
            for (let j = 0; j < scanLimit; j++) {
                mergedLines += lines[i + j] + ' ';
                const amountMatches = [...mergedLines.matchAll(this.amountRegex)];
                if (amountMatches.length >= 1) {
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
            const dateMatches = [...line.matchAll(this.dateRegex)];
            let date = new Date();
            for (let j = dateMatches.length - 1; j >= 0; j--) {
                const dm = dateMatches[j];
                const dateStr = dm[0];
                line = line.slice(0, dm.index) + line.slice(dm.index! + dateStr.length);
                date = this.parseDate(dm);
            }
            date.setMilliseconds(date.getMilliseconds() + transactions.length); // ensure unique timestamps

            // extract amount
            const amountMatches = [...line.matchAll(this.amountRegex)];
            if (amountMatches.length < 2) continue;
            let amount = parseFloat(amountMatches[0][1]);
            for (let j = amountMatches.length - 1; j >= 0; j--) {
                const am = amountMatches[j];
                const amountStr = am[0];
                line = line.slice(0, am.index) + line.slice(am.index! + amountStr.length);
            }

            line = line.replace('TFR', '');
            if (line.indexOf('Cr') !== -1) {
                line = line.replace('Cr', '');
                amount = Math.abs(amount);
            } else if (line.indexOf('Dr') !== -1) {
                line = line.replace('Dr', '');
                amount = -Math.abs(amount);
            }

            const description = line.trim().replace(/\s+/g, ' ');

            if (isNaN(amount)) continue;
            transactions.push({
                date,
                amount,
                description,
            });

        }
        return transactions;
    }

    private parseDate(dateMatch: RegExpMatchArray): Date {
        const [_, dayStr, monthStr, yearStr] = dateMatch;
        return new Date(
            parseInt(yearStr),
            parseInt(monthStr) - 1,
            parseInt(dayStr)
        )
    }

    private removeHeaderAndFooterLines(pages: string[][]): string[] {
        const cleanedLines: string[] = [];
        for (const page of pages) {
            const headerLineIndex = page.findIndex(line => this.dateStartRegex.test(line));
            if (headerLineIndex === -1) continue;
            let footerLineIndex = page.length;
            for (let i = headerLineIndex; i < page.length; i++) {
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
import type { ImportedTransaction } from "../../interfaces/ImportData";

export class FederalBankPdfFileParser {
    public static isFederalBankFile(pages: string[][]): boolean {
        console.log(pages);
        return pages.some(page => /Federal Bank/i.test(page.join(' ')));
    }

    private static cardNumberLabelRegex = /Credit[\s]+Card[\s]+Number/i;
    private static cardNumberRegex = /([\dX]{16})/;

    public static extractCardNumber(pages: string[][]): string | null {
        for (const page of pages) {
            for (let i = 0; i < page.length; i++) {
                if (this.cardNumberLabelRegex.test(page[i])) {
                    while (!this.cardNumberRegex.test(page[i]) && i < page.length - 1) i++;
                    const match = page[i].match(this.cardNumberRegex);
                    if (match) return match[1];
                }
            }
        }
        return null;
    }

    private static lineRegex = /^\d{1,2}-\d{1,2}-\d{2,4}.+[Cr|Dr]$/;
    private static dateRegex = /(\d{1,2})-(\d{1,2})-(\d{2,4})/g;

    public static extractTransactions(pages: string[][]): ImportedTransaction[] {
        const cleanedLines: string[] = this.removeHeaderAndFooterLines(pages);
        const transactions = this.parseTransactions(cleanedLines);
        return transactions;
    }

    private static amountRegex = /(\d{1,3}(?:,\d{2,3})+(?:\.\d+)?|\d+\.\d{2})/g;

    // 53, 836
    private static parseTransactions(lines: string[]): ImportedTransaction[] {

        const transactions: ImportedTransaction[] = [];
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];

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
            if (amountMatches.length < 1) continue;
            let amount = parseFloat(amountMatches[0][1].replaceAll(',', ''));
            for (let j = amountMatches.length - 1; j >= 0; j--) {
                const am = amountMatches[j];
                const amountStr = am[0];
                line = line.slice(0, am.index) + line.slice(am.index! + amountStr.length);
            }

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

    private static parseDate(dateMatch: RegExpMatchArray): Date {
        const [_, dayStr, monthStr, yearStr] = dateMatch;
        return new Date(
            parseInt(yearStr),
            parseInt(monthStr) - 1,
            parseInt(dayStr)
        )
    }

    private static removeHeaderAndFooterLines(pages: string[][]): string[] {
        const cleanedLines: string[] = [];
        for (const page of pages) {
            for (const line of page) {
                if (this.lineRegex.test(line)) {
                    cleanedLines.push(line);
                }
            }
        }
        return cleanedLines;
    }
}
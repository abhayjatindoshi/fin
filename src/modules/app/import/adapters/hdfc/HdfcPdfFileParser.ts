import type { ImportedTransaction } from "../../interfaces/ImportData";

export class HdfcPdfFileParser {
    public static isHdfcFile(pages: string[][]): boolean {
        return pages.some(page => /HDFC/i.test(page.join(' ')));
    }

    private static accountNumberLabelRegex = /Account[\s]+Number|Account[\s]+No/i;
    private static accountNumberRegex = /(\d{10,})/;

    public static extractAccountNumber(pages: string[][]): string | null {
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

    private static dateStartRegex = /^(\d{1,2}\/\d{1,2}\/\d{2,4})\b/;

    public static extractTransactions(pages: string[][]): ImportedTransaction[] {
        const filteredPages = pages.filter(page => page.some(line => this.dateStartRegex.test(line)));

        return [];
    }
}
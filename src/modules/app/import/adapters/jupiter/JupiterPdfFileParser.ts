import type { ImportedTransaction } from "../../interfaces/ImportData";

export class JupiterPdfFileParser {
    public static isJupiterFile(pages: string[][]): boolean {
        return pages.some(page => /Jupiter/i.test(page.join(' ')));
    }

    private static accountNumberRegex = /Account[\s]+Number[\s]+(\d{10,})/i;

    public static extractAccountNumber(pages: string[][]): string | null {
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

    private static dateStartRegex = /^\d{1,2}\/\d{1,2}\/\d{2,4}.*/;
    private static dateRegex = /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/g;

    public static extractTransactions(pages: string[][]): ImportedTransaction[] {
        const cleanedLines: string[] = this.removeHeaderAndFooterLines(pages);
        const transactions = this.parseTransactions(cleanedLines);
        return transactions;
    }

    private static amountRegex = /(\d{1,}\.\d{2})/g;

    // 53, 836
    private static parseTransactions(lines: string[]): ImportedTransaction[] {
        console.log(lines);
        const transactions: ImportedTransaction[] = [];
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

    private static parseDate(dateMatch: RegExpMatchArray): Date {
        const [_, dayStr, monthStr, yearStr] = dateMatch;
        return new Date(
            parseInt(yearStr),
            parseInt(monthStr) - 1,
            parseInt(dayStr)
        )
    }

    private static skipLinesAfter = [
        /^Page/i,
        /^GRAND TOTAL/i,
    ]

    private static removeHeaderAndFooterLines(pages: string[][]): string[] {
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
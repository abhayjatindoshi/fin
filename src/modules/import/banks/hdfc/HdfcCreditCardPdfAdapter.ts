import type { ImportData, TransactionDetails } from "../../interfaces/ImportData";
import type { IPdfFile, IPdfImportAdapter } from "../../interfaces/IPdfImportAdapter";

export class HdfcCreditCardPdfAdapter implements IPdfImportAdapter {
    id = 'hdfc-credit-card-pdf';
    type: 'file' = 'file';
    fileType: 'pdf' = 'pdf';

    // Identification
    private creditCardGstinRegex = /HDFC Bank Credit Cards GSTIN/i;
    private creditCardStatementRegex = /Credit Card Statement/i;

    // Account number extraction
    private creditCardNumberLabelRegex = /Credit Card No\./i;
    private alternateAccountNumberLabelRegex = /Alternate Account Number/i;
    private maskedCardNumberRegex = /\d[\dX]{11,}/i;
    private numericAccountNumberRegex = /\d{10,}/;

    // Account holder name: ALL-CAPS words between the transaction column header and the first transaction line
    private transactionHeaderRegex = /DATE & TIME\s+TRANSACTION DESCRIPTION/i;
    private accountHolderNameRegex = /^[A-Z][A-Z\s]+[A-Z]$/;

    // Statement metadata labels and values
    private statementDateLabelRegex = /^Statement Date$/i;
    private billingPeriodLabelRegex = /^Billing Period$/i;
    private statementDateValueRegex = /^\d{1,2}\s+[A-Za-z]+,\s+\d{4}$/;
    private billingPeriodValueRegex = /^(\d{1,2}\s+[A-Za-z]+,\s+\d{4})\s*-\s*(\d{1,2}\s+[A-Za-z]+,\s+\d{4})$/;

    // Transaction parsing
    // Format: DD/MM/YYYY| HH:MM   DESCRIPTION   + [REWARDS]   C   AMOUNT   [l]
    private dateTimeRegex = /^(\d{2}\/\d{2}\/\d{4})\|\s*(\d{2}:\d{2})/;
    // Reward points field: either "+ NUMBER" (purchase/debit) or "+" alone (payment/credit)
    private rewardsAndAmountRegex = /\+\s*(\d*)\s*C\s*([\d,]+(?:\.\d+)?)/;

    private skipLinePatterns = [
        /^Page \d+ of \d+/i,
        /^Domestic Transactions$/i,
        /^International Transactions$/i,
        /^DATE & TIME\s+TRANSACTION DESCRIPTION/i,
        /^Eligible for\s+EMI/i,
        /^TOTAL AMOUNT$/i,
        /^Rewards Program Points Summary/i,
        /^SR NO\.\s+PROGRAMS/i,
        /^Important Information$/i,
        /^Useful Links$/i,
        /^Statement & Payment/i,
        /^MITC /i,
        /^Payment Options/i,
        /^Customer Rights Policy/i,
        /^HSN Code/i,
        /^HDFC Bank Credit Cards GSTIN/i,
    ];

    isSupported(file: IPdfFile): boolean {
        return file.pages.some(page =>
            page.some(line => this.creditCardGstinRegex.test(line)) &&
            page.some(line => this.creditCardStatementRegex.test(line))
        );
    }

    async read(file: IPdfFile): Promise<ImportData> {
        const accountNumber = this.extractAccountNumber(file.pages);
        if (!accountNumber) throw new Error('Unable to extract account number from HDFC Credit Card PDF file.');
        const accountHolderName = this.extractAccountHolderName(file.pages);
        const alternateAccountNumber = this.extractAlternateAccountNumber(file.pages);
        const transactions = this.extractTransactions(file.pages);
        return {
            account: {
                accountNumber: [accountNumber],
                ...(accountHolderName && { accountHolderName: [accountHolderName] }),
                ...(alternateAccountNumber && { customerId: [alternateAccountNumber] }),
            },
            transactions,
        };
    }

    public extractAccountNumber(pages: string[][]): string | null {
        for (const page of pages) {
            for (let i = 0; i < page.length; i++) {
                if (!this.creditCardNumberLabelRegex.test(page[i])) continue;
                // The value can be in the same line or the next few lines
                for (let j = i; j < Math.min(i + 5, page.length); j++) {
                    const match = page[j].match(this.maskedCardNumberRegex);
                    if (match) return match[0];
                }
            }
        }
        // Fallback: alternate account number (fully numeric)
        for (const page of pages) {
            for (let i = 0; i < page.length; i++) {
                if (!this.alternateAccountNumberLabelRegex.test(page[i])) continue;
                for (let j = i; j < Math.min(i + 5, page.length); j++) {
                    const match = page[j].match(this.numericAccountNumberRegex);
                    if (match) return match[0];
                }
            }
        }
        return null;
    }

    public extractAccountHolderName(pages: string[][]): string | null {
        for (const page of pages) {
            for (let i = 0; i < page.length - 1; i++) {
                if (!this.transactionHeaderRegex.test(page[i])) continue;
                // The cardholder name appears as a section header between the column header line
                // and the first transaction line (only on the first page of transactions for that cardholder)
                for (let j = i + 1; j < Math.min(i + 3, page.length); j++) {
                    const line = page[j].trim();
                    if (this.dateTimeRegex.test(line)) break;
                    if (this.accountHolderNameRegex.test(line)) return line;
                }
            }
        }
        return null;
    }

    public extractAlternateAccountNumber(pages: string[][]): string | null {
        for (const page of pages) {
            for (let i = 0; i < page.length; i++) {
                if (!this.alternateAccountNumberLabelRegex.test(page[i])) continue;
                // Values appear after the label block; skip other label lines while searching forward
                for (let j = i + 1; j < Math.min(i + 8, page.length); j++) {
                    const line = page[j].trim();
                    if (this.statementDateLabelRegex.test(line) || this.billingPeriodLabelRegex.test(line)) continue;
                    const match = line.match(this.numericAccountNumberRegex);
                    if (match) return match[0];
                }
            }
        }
        return null;
    }

    public extractStatementDate(pages: string[][]): string | null {
        for (const page of pages) {
            for (let i = 0; i < page.length; i++) {
                if (!this.statementDateLabelRegex.test(page[i].trim())) continue;
                for (let j = i + 1; j < Math.min(i + 8, page.length); j++) {
                    const line = page[j].trim();
                    if (this.statementDateValueRegex.test(line)) return line;
                }
            }
        }
        return null;
    }

    public extractBillingPeriod(pages: string[][]): { start: string; end: string } | null {
        for (const page of pages) {
            for (let i = 0; i < page.length; i++) {
                if (!this.billingPeriodLabelRegex.test(page[i].trim())) continue;
                for (let j = i + 1; j < Math.min(i + 8, page.length); j++) {
                    const match = page[j].match(this.billingPeriodValueRegex);
                    if (match) return { start: match[1], end: match[2] };
                }
            }
        }
        return null;
    }

    public extractTransactions(pages: string[][]): TransactionDetails[] {
        const allLines: string[] = [];
        for (const page of pages) {
            for (const line of page) {
                if (!this.skipLinePatterns.some(re => re.test(line.trim()))) {
                    allLines.push(line);
                }
            }
        }
        return this.parseTransactions(allLines);
    }

    private parseTransactions(lines: string[]): TransactionDetails[] {
        const transactions: TransactionDetails[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const dateMatch = line.match(this.dateTimeRegex);
            if (!dateMatch) continue;

            // Merge continuation lines (e.g. wrapped reference numbers) until we find
            // the rewards+amount pattern or hit the next transaction
            let mergedLine = line;
            for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
                if (this.dateTimeRegex.test(lines[j])) break;
                if (this.rewardsAndAmountRegex.test(mergedLine)) break;
                mergedLine += ' ' + lines[j];
                i = j;
            }

            const rewardsAmountMatch = mergedLine.match(this.rewardsAndAmountRegex);
            if (!rewardsAmountMatch) continue;

            const rewardPointsStr = rewardsAmountMatch[1]; // empty = no points = credit/payment
            const amountStr = rewardsAmountMatch[2];
            const amount = parseFloat(amountStr.replace(/,/g, ''));
            if (isNaN(amount)) continue;

            // A transaction with no reward points is a credit (payment to the card account → positive).
            // A transaction with reward points is a debit (purchase → negative).
            const isCredit = rewardPointsStr === '';
            const signedAmount = isCredit ? amount : -amount;

            const date = this.parseDateTime(dateMatch[1], dateMatch[2]);
            date.setMilliseconds(transactions.length); // preserve order for same-second transactions

            // Description = everything between the datetime prefix and the rewards/amount part
            const rewardsAmountIndex = mergedLine.indexOf(rewardsAmountMatch[0]);
            let description = mergedLine.slice(dateMatch[0].length, rewardsAmountIndex).trim();
            description = description.replace(/\s+/g, ' ').trim();

            transactions.push({ date, amount: signedAmount, description });
        }

        return transactions;
    }

    private parseDateTime(dateStr: string, timeStr: string): Date {
        const [day, month, year] = dateStr.split('/').map(Number);
        const [hours, minutes] = timeStr.split(':').map(Number);
        return new Date(year, month - 1, day, hours, minutes);
    }
}

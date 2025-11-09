import { FileUtils } from "@/modules/app/common/FileUtils";
import { ImportError } from "@/modules/app/services/ImportService";
import type { IFileImportAdapter } from "../../interfaces/IFileImportAdapter";
import type { ImportAdapterType } from "../../interfaces/IImportAdapter";
import type { ImportData, ImportedTransaction } from "../../interfaces/ImportData";

export class HdfcCreditCard implements IFileImportAdapter {
    name = 'hdfc-credit-card'
    type: ImportAdapterType = 'credit-card';
    supportedFileTypes = ['.pdf']
    display = {
        bankName: 'HDFC Bank',
        icon: 'hdfc',
        type: 'Credit Card',
    };

    isFileSupported = () => Promise.resolve(true);

    readFile = async (file: File, possiblePasswords?: string[]): Promise<ImportData> => {
        const passwords = [undefined, ...possiblePasswords || []];
        let pages;
        for (const pwd of passwords) {
            try {
                pages = await FileUtils.readPdfFile(file, pwd);
                break;
            } catch {
                continue;
            }
        }

        if (!pages) throw new ImportError('PASSWORD_REQUIRED', 'Unable to open PDF file; password may be required');

        const importData: ImportData = {
            identifiers: this.extractIdentifiers(pages),
            transactions: this.extractTransactions(pages),
        };
        console.log(importData);
        return importData;
    };

    extractIdentifiers(pages: string[][]): string[] {
        const flat: string[] = pages.flat();

        let accountNumber: string | undefined;

        // Helper to normalize line.
        const norm = (s: string) => s.trim();

        // First pass: look for explicit labels then colon-prefixed value lines.
        for (let i = 0; i < flat.length; i++) {
            const line = norm(flat[i]);
            if (!accountNumber && /account number|Account No/i.test(line)) {
                for (let j = i; j < Math.min(flat.length, i + 8); j++) {
                    const cand = norm(flat[j]);
                    const m = /(\d{10,})/.exec(cand);
                    if (m) {
                        accountNumber = m[1];
                        break;
                    }
                }
            }
            if (accountNumber) break;
        }

        // Fallback pass: just find colon-prefixed numbers.
        if (!accountNumber) {
            const colonNumberLines = flat.map(norm).filter(s => /^: \d{5,}$/.test(s));
            // If accountNumber missing: choose longest (likely bigger) or second distinct.
            if (!accountNumber && colonNumberLines.length) {
                const candidates = colonNumberLines.map(s => s.replace(/^: /, ''));
                // Prefer one >= 12 digits.
                accountNumber = candidates.find(c => c.length >= 12) || candidates[0];
            }
        }

        const identifiers: string[] = [];
        if (accountNumber) identifiers.push(accountNumber);

        return identifiers;
    }

    extractTransactions(pages: string[][]): ImportedTransaction[] {
        // The savings account PDF (samples) is extracted as fragmented lines.
        // Observations (from sample1.json & sample2.json):
        //  - Each transaction starts with a date in format DD/MM/YY (or DD/MM/YYYY for sample2).
        //  - Columns (ideal header): Date  Narration  Chq/Ref  Value Dt  Withdrawal Amt  Deposit Amt  Closing Balance.
        //  - In extracted text often only ONE amount (either withdrawal or deposit) plus the closing balance are present.
        //  - Deposit vs withdrawal can be inferred by comparing the new closing balance with the previous one
        //    (increase => credit/deposit, decrease => debit/withdrawal).
        //  - Some narration spans multiple subsequent lines until the next date line.
        //  - Reference / account / value date numeric tokens (long numbers) are intermixed; we keep narration simple by
        //    joining all record lines then trimming trailing numeric tokens for amounts.
        //  - Indian number format with commas appears (e.g., 1,303,994.96 or 4,73,348.25). We normalize by removing commas.
        //  - Heuristics for sign (used only if previous closing balance absent): keywords like 'NEFT CR', 'ACH C', 'INTEREST',
        //    'REV-', 'IMPS CR' indicate credit; 'NEFT DR', 'ACH D', 'IMPS-', 'UPI-' (generally) indicate debit.

        const flatLines = pages.flat().map(l => l.trim()).filter(l => l.length > 0);

        // Filter out obvious page footer/header noise lines to reduce false positives.
        const noisePatterns = [
            /^Page No/i,
            /^Statement of account/i,
            /^MR\./i,
            /HDFC BANK LTD\.?/i,
            /HDFC BANK LIMITED/i,
            /^Nomination/i,
            /^Statement From/i,
            /^Address/i,
            /^Email/i,
            /^Cust ID/i,
            /^Account No/i,
            /^A\/C Open Date/i,
            /^Account Status/i,
            /^RTGS\/NEFT IFSC/i,
            /^Branch Code/i,
            /^Account Type/i,
            /GSTIN/i,
            /Registered Office Address/i,
            /^Opening Balance/i,
            /^Txn Date/i,
            /^SUMMARY$/i,
            /^Closing Balance Credit Amount/i,
            /^Credit Count Debit Count/i,
            /\*\*FD may be linked/i,
            /\*Closing balance includes/i,
            /Contents of this statement/i,
            /Total Withdrawable/i,
            /Your Combined statement generation frequency/i,
            /\*\* Total Withdrawable/i,
            /^STATEMENT SUMMARY/,
            /^STATEMENT AS ON/i,
        ];

        const isNoise = (line: string) => noisePatterns.some(p => p.test(line));

        const dateStartRegex = /^(\d{1,2}\/\d{1,2}\/\d{2,4})\b/;

        // Group lines into raw transaction record blocks starting at date lines.
        const records: string[][] = [];
        let current: string[] | null = null;
        for (const line of flatLines) {
            if (isNoise(line)) continue;
            if (dateStartRegex.test(line)) {
                if (current) records.push(current);
                current = [line];
            } else if (current) {
                current.push(line);
            }
        }
        if (current) records.push(current);

        const amountTokenRegex = /(\d{1,3}(?:,\d{2,3})+(?:\.\d+)?|\d+\.\d{2})/g; // prefer tokens with decimals for monetary amounts
        const parseNumber = (s: string) => parseFloat(s.replace(/,/g, ''));

        const transactions: ImportedTransaction[] = [];
        let prevClosing: number | undefined;

        for (const recLines of records) {
            if (recLines.length === 0) continue;
            const firstLine = recLines[0];
            const dateMatch = dateStartRegex.exec(firstLine);
            if (!dateMatch) continue; // safety
            const dateStr = dateMatch[1];
            // Normalize year to 4 digits if 2-digit.
            const [d, m, yRaw] = dateStr.split('/');
            const yNum = parseInt(yRaw, 10);
            const fullYear = yRaw.length === 2 ? (yNum >= 70 ? 1900 + yNum : 2000 + yNum) : yNum;
            const dateObj = new Date(fullYear, parseInt(m, 10) - 1, parseInt(d, 10));

            // Combine record text.
            const recordText = recLines.join(' ');

            // Extract all numeric tokens to find amount & closing balance.
            const numericTokens = [...recordText.matchAll(amountTokenRegex)].map(m => m[1]);
            if (numericTokens.length < 2) continue; // need at least amount + closing
            const closingBalStr = numericTokens[numericTokens.length - 1];
            const closingBalance = parseNumber(closingBalStr);
            // Find amount token: search backwards for a token with decimal OR comma that is not the same as closing.
            let amountStr: string | undefined;
            for (let i = numericTokens.length - 2; i >= 0; i--) {
                const tok = numericTokens[i];
                if (tok === closingBalStr) continue; // skip if same value repeated (rare)
                // Prefer tokens with a decimal (monetary) vs long plain integers which are often references.
                if (/\.\d{2}$/.test(tok)) {
                    amountStr = tok;
                    break;
                }
            }
            if (!amountStr) continue;
            const rawAmount = parseNumber(amountStr);

            // Build narration / description (remove starting date and trailing amount + closing balance tokens).
            // Strategy: remove starting date substring, then remove last occurrence of amountStr and closingBalStr.
            let desc = recordText.replace(dateStartRegex, '').trim();
            // Remove closing balance (last occurrence)
            const closingIdx = desc.lastIndexOf(closingBalStr);
            if (closingIdx >= 0) {
                desc = (desc.slice(0, closingIdx) + desc.slice(closingIdx + closingBalStr.length)).trim();
            }
            // Remove amount (last occurrence)
            const amtIdx = desc.lastIndexOf(amountStr);
            if (amtIdx >= 0) {
                desc = (desc.slice(0, amtIdx) + desc.slice(amtIdx + amountStr.length)).trim();
            }
            // Collapse multiple spaces
            desc = desc.replace(/\s{2,}/g, ' ');

            // Determine sign.
            let signedAmount: number;
            if (prevClosing !== undefined) {
                if (closingBalance > prevClosing) signedAmount = rawAmount; // balance increased => credit
                else if (closingBalance < prevClosing) signedAmount = -rawAmount; // decreased => debit
                else {
                    // Same balance (unlikely); fallback to heuristic.
                    signedAmount = heuristicSign(desc, rawAmount);
                }
            } else {
                signedAmount = heuristicSign(desc, rawAmount);
            }

            transactions.push({ date: dateObj, description: desc, amount: signedAmount });
            prevClosing = closingBalance;
        }

        return transactions;

        function heuristicSign(desc: string, amt: number): number {
            const upper = desc.toUpperCase();
            const creditHints = [' NEFT CR', ' ACH C', ' INTEREST', ' REV-UPI', ' DIV', ' CREDIT', ' IMPS CR', ' CR-'];
            const debitHints = [' NEFT DR', ' ACH D', ' UPI-', ' IMPS-', ' ATW-', ' CBDT/', ' TAX', ' LOAN', ' DR-'];
            if (creditHints.some(h => upper.includes(h))) return amt;
            if (debitHints.some(h => upper.includes(h))) return -amt;
            // Fallback guess: treat positive (deposit) if description contains words like PAYMENT FOR (salary) or SALARY
            if (/SALARY|DIV|INTEREST|REFUND|REV-/i.test(desc)) return amt;
            return -amt; // default assume withdrawal
        }
    }
}
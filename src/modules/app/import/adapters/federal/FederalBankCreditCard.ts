import { FileUtils } from "@/modules/app/common/FileUtils";
import { ImportError } from "@/modules/app/services/ImportService";
import type { IFileImportAdapter } from "../../interfaces/IFileImportAdapter";
import type { ImportAdapterType } from "../../interfaces/IImportAdapter";
import type { ImportData } from "../../interfaces/ImportData";
import { FederalBankPdfFileParser } from "./FederalBankPdfFileParser";

export class FederalBankCreditCard implements IFileImportAdapter {
    name = 'federal-bank-credit-card'
    type: ImportAdapterType = 'credit-card';
    supportedFileTypes = ['.pdf']
    display = {
        bankName: 'Federal Bank',
        icon: 'federal',
        type: 'Credit Card',
    };

    async isFileSupported(file: File, possiblePasswords?: string[]): Promise<boolean> {
        if (!this.isPdfFile(file)) return Promise.resolve(false);
        try {
            const pages = await this.readPdfFile(file, possiblePasswords);
            return FederalBankPdfFileParser.isFederalBankFile(pages);
        } catch (err) {
            if (err instanceof ImportError && err.type === 'PASSWORD_REQUIRED') return true;
            throw err;
        }
    }

    async readFile(file: File, possiblePasswords?: string[]): Promise<ImportData> {
        if (!this.isPdfFile(file)) throw new ImportError('UNSUPPORTED_FILE', 'Only PDF files are supported.');
        const pages = await this.readPdfFile(file, possiblePasswords);

        const cardNumber = FederalBankPdfFileParser.extractCardNumber(pages);
        if (!cardNumber) throw new ImportError('IMPORT_FAILED', 'Unable to extract account number from Federal Bank PDF file.');

        const transactions = FederalBankPdfFileParser.extractTransactions(pages);

        return {
            identifiers: [cardNumber],
            transactions
        }
    }

    private isPdfFile(file: File): boolean {
        return file.type === 'application/pdf';
    }

    private async readPdfFile(file: File, possiblePasswords?: string[]): Promise<string[][]> {
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

        return pages;
    }

}
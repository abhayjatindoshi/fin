import { FileUtils } from "@/modules/app/common/FileUtils";
import { ImportError } from "@/modules/app/services/ImportService";
import type { IFileImportAdapter } from "../../interfaces/IFileImportAdapter";
import type { ImportAdapterType } from "../../interfaces/IImportAdapter";
import type { ImportData } from "../../interfaces/ImportData";
import { JupiterPdfFileParser } from "./JupiterPdfFileParser";

export class JupiterBankAccount implements IFileImportAdapter {
    name = 'jupiter-bank-account'
    type: ImportAdapterType = 'savings-account';
    supportedFileTypes = ['.pdf']
    display = {
        bankName: 'Jupiter',
        icon: 'jupiter',
        type: 'Savings Account',
    };

    async isFileSupported(file: File, possiblePasswords?: string[]): Promise<boolean> {
        if (!this.isPdfFile(file)) return Promise.resolve(false);
        const pages = await this.readPdfFile(file, possiblePasswords);
        return JupiterPdfFileParser.isJupiterFile(pages);
    }

    async readFile(file: File, possiblePasswords?: string[]): Promise<ImportData> {
        if (!this.isPdfFile(file)) throw new ImportError('UNSUPPORTED_FILE', 'Only PDF files are supported.');
        const pages = await this.readPdfFile(file, possiblePasswords);

        const accountNumber = JupiterPdfFileParser.extractAccountNumber(pages);
        if (!accountNumber) throw new ImportError('IMPORT_FAILED', 'Unable to extract account number from Jupiter PDF file.');

        const transactions = JupiterPdfFileParser.extractTransactions(pages);

        return {
            identifiers: [accountNumber],
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
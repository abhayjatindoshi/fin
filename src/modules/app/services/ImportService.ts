import { Utils } from "@/modules/common/Utils";
import { EntityUtils } from "../common/EntityUtils";
import { FileUtils } from "../common/FileUtils";
import { EntityName } from "../entities/entities";
import { type MoneyAccount } from "../entities/MoneyAccount";
import { TransactionSchema, type Transaction, type TransactionSource } from "../entities/Transaction";
import { ImportMatrix } from "../import/ImportMatrix";
import type { IBank } from "../import/interfaces/IBank";
import type { IBankOffering } from "../import/interfaces/IBankOffering";
import type { IFile, IFileImportAdapter } from "../import/interfaces/IFileImportAdapter";
import type { ImportData, ImportedTransaction } from "../import/interfaces/ImportData";
import type { IPdfFile } from "../import/interfaces/IPdfImportAdapter";
import { BaseService } from "./BaseService";
import { SettingService } from "./SettingService";

export type PasswordPrompt = {
    message: string;
}

export type ImportError = Error

export type ImportResult = {
    importSource: TransactionSource;
    importedTransactions: ImportedTransaction[];
    importedAccounts: MoneyAccount[];
}

export class ImportService extends BaseService {

    // Step 1: find the file type
    // Step 2: check if we have stored passwords to unlock the file
    // Step 3: find and prompt user if multiple adapters that support this file
    // Step 4: use the selected adapter to generate import data
    // Step 5: apply the import data

    async readFile(file: File, password?: string): Promise<IFile | PasswordPrompt | null> {
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
            return this.readPdfFile(file, password);
        }
        return null;
    }

    getSupportedFileAdapters(file: IFile): IFileImportAdapter<any>[] {
        const supportedAdapters = Object.values(ImportMatrix.Adapters)
            .filter(a => a.type === 'file')
            .map(a => a as IFileImportAdapter<any>)
            .filter(a => a.fileType === file.type)
            .filter(a => a.isSupported(file))
        return supportedAdapters;
    }

    async importFile(file: IFile, adapter: IFileImportAdapter<any>): Promise<ImportResult | ImportError> {
        try {
            const importData = await adapter.read(file);
            const [bank, offering] = ImportMatrix.AdapterBankData[adapter.id];
            const matchingAccounts = await this.findMatchingAccounts(bank, offering, importData);
            const parsedTransactions = await this.parseTransactions(importData.transactions);
            return {
                importSource: {
                    type: 'file',
                    fileName: file.name,
                },
                importedAccounts: matchingAccounts,
                importedTransactions: parsedTransactions,
            }
        } catch (error) {
            return error as ImportError;
        }
    }

    async applyImport(importResult: ImportResult): Promise<void> {
        const moneyAccountRepo = this.repository(EntityName.MoneyAccount);
        const transactionRepo = this.repository(EntityName.Transaction);

        if (importResult.importedAccounts.length !== 1) {
            throw new Error('Only one account must be imported');
        }

        const account = importResult.importedAccounts[0];
        if (!account.id) {
            account.id = moneyAccountRepo.save(account);
        }

        // Create transactions
        for (const tx of importResult.importedTransactions) {
            if (!tx.isNew) continue;
            const transaction = TransactionSchema.parse({
                accountId: account.id as Transaction["accountId"],
                title: '',
                narration: tx.description,
                transactionAt: tx.date,
                amount: tx.amount,
                hash: tx.hash!,
                source: importResult.importSource,
            });
            transactionRepo.save(transaction);
        }
    }

    private async readPdfFile(file: File, passwordInput?: string): Promise<IPdfFile | PasswordPrompt> {
        const passwords = passwordInput ? [passwordInput] :
            await this.getStoredPasswords();

        let pages: string[][] | null = null;
        for (const password of passwords) {
            try {
                pages = await FileUtils.readPdfFile(file, password);
                await this.addStoredPassword(password);
                break;
            } catch { }
        }

        if (!pages) {
            if (passwordInput) {
                return { message: "You've entered an incorrect password. Please try again." };
            } else {
                return { message: "This PDF file is password protected. Please enter the password to proceed." };
            }
        }

        return {
            name: file.name,
            type: 'pdf',
            pages: pages
        }
    }

    private async addStoredPassword(password: string): Promise<void> {
        const storedPasswords = await this.getStoredPasswords();
        if (!storedPasswords.includes(password)) {
            storedPasswords.push(password);
            await new SettingService().update("import.storedPasswords", Utils.stringifyJson(storedPasswords));
        }
    }

    private async getStoredPasswords(): Promise<string[]> {
        const storedPasswords = await new SettingService().get("import.storedPasswords");
        try {
            return Utils.parseJson(storedPasswords)
        } catch {
            return [];
        }
    }

    async findMatchingAccounts(bank: IBank, offering: IBankOffering, importData: ImportData): Promise<MoneyAccount[]> {
        const accountRepo = this.repository(EntityName.MoneyAccount);
        const allAccounts = await accountRepo.getAll() as MoneyAccount[];
        const matchingAccounts = allAccounts
            .filter(a => a.identifiers.some(id => importData.identifiers.includes(id)));

        if (matchingAccounts.length > 0) return matchingAccounts;

        return [{
            bankId: bank.id,
            offeringId: offering.id,
            accountNumber: importData.identifiers[0],
            initialBalance: 0,
            identifiers: importData.identifiers,
            active: true,
        } as MoneyAccount];
    }

    async parseTransactions(transactions: ImportedTransaction[]): Promise<ImportedTransaction[]> {
        const years = Array.from(new Set(transactions.map(tx => tx.date.getFullYear())));
        const allTransactions = await this.repository(EntityName.Transaction).getAll({ years: years }) as Transaction[];
        await Promise.all(transactions.map(async tx => {
            tx.hash = EntityUtils.hashTransaction(tx.date, tx.amount, tx.description);
            tx.isNew = !allTransactions.some(existingTx => existingTx.hash === tx.hash);
        }));
        return transactions;
    }
}
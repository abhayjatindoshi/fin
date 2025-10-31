import { EntityUtils } from "../common/EntityUtils";
import { AdapterDataSchema, type AdapterData } from "../entities/AdapterData";
import { EntityName } from "../entities/entities";
import type { MoneyAccount } from "../entities/MoneyAccount";
import { TransactionSchema, type Transaction } from "../entities/Transaction";
import { ImportHandler } from "../import/ImportHandler";
import type { IFileImportAdapter } from "../import/interfaces/IFileImportAdapter";
import type { ImportedTransaction } from "../import/interfaces/ImportData";
import { BaseService } from "./BaseService";

export type ImportErrorType =
    | 'NO_ADAPTER'
    | 'MULTIPLE_ADAPTERS'
    | 'UNSUPPORTED_FILE'
    | 'PASSWORD_REQUIRED'
    | 'IMPORT_FAILED'
    ;

export class ImportError extends Error {

    public type: ImportErrorType;
    public adapters?: IFileImportAdapter[];

    constructor(type: ImportErrorType, message: string, adapters?: IFileImportAdapter[]) {
        super(message);
        this.type = type;
        this.adapters = adapters;
    }

    public toString(): string {
        return `[${this.type}]: ${this.message}`;
    }
}

export type ImportResult = {
    importedTransactions: ImportedTransaction[];
    importedAccounts: MoneyAccount[];
}

export class ImportService extends BaseService {

    public getAdapterData(account: MoneyAccount): IFileImportAdapter | undefined {
        return ImportHandler.getFileAdapterByName(account.adapterName);
    }

    public async addPassword(adapter: IFileImportAdapter, password: string) {
        const adapterDataRepo = this.repository(EntityName.AdapterData);
        const adapterData = await adapterDataRepo.getAll({ where: { name: adapter.name } }) as AdapterData[];
        if (adapterData.length === 0) {
            const newData: AdapterData = AdapterDataSchema.parse({
                name: adapter.name,
                passwords: [password],
            });
            adapterDataRepo.save(newData);
            return;
        }
        adapterData.forEach(data => {
            if (!data.passwords.includes(password)) {
                data.passwords.push(password);
                adapterDataRepo.save(data);
            }
        });
    }

    public async import(file: File, adapter?: IFileImportAdapter): Promise<ImportResult> {
        const adapters = ImportHandler.getSupportedFileAdapters(file);
        if (adapters.length === 0) throw new ImportError('NO_ADAPTER', 'No suitable adapter found for the provided file');
        if (adapters.length > 1 && !adapter) throw new ImportError('MULTIPLE_ADAPTERS', 'Multiple adapters found for the provided file; please specify one explicitly', adapters);
        if (adapter && !adapters.includes(adapter)) throw new ImportError('UNSUPPORTED_FILE', 'The specified adapter does not support the provided file', adapters);
        adapter = adapter || adapters[0];

        try {
            const adapterDataArray = await this.repository(EntityName.AdapterData).getAll({ where: { name: adapter.name } }) as AdapterData[];
            const allPasswords = adapterDataArray.flatMap(data => data.passwords);
            const importData = await adapter.readFile(file, allPasswords);

            const allAccounts = await this.repository(EntityName.MoneyAccount).getAll({ where: { adapterName: adapter.name } }) as MoneyAccount[];
            const matchingAccounts = allAccounts.filter(account => importData.identifiers.some(id => account.identifiers.includes(id)));

            if (matchingAccounts.length === 0) {
                matchingAccounts.push({
                    adapterName: adapter.name,
                    accountNumber: importData.identifiers[0],
                    initialBalance: 0,
                    identifiers: importData.identifiers,
                    active: true,
                } as MoneyAccount);
            }

            const years = Array.from(new Set(importData.transactions.map(tx => tx.date.getFullYear())));
            const allTransactions = await this.repository(EntityName.Transaction).getAll({ years: years }) as Transaction[];
            await Promise.all(importData.transactions.map(async tx => {
                tx.hash = EntityUtils.hashTransaction(tx.date, tx.amount, tx.description);
                tx.isNew = !allTransactions.some(existingTx => existingTx.hash === tx.hash);
            }));

            return {
                importedAccounts: matchingAccounts,
                importedTransactions: importData.transactions,
            }
        } catch (error) {
            // Preserve existing ImportError types (e.g. PASSWORD_REQUIRED) for UI to handle
            if (error instanceof ImportError) throw error;
            throw new ImportError('IMPORT_FAILED', (error as Error).message, adapters);
        }
    }

    public async apply(importResult: ImportResult): Promise<void> {
        const moneyAccountRepo = this.repository(EntityName.MoneyAccount);
        const transactionRepo = this.repository(EntityName.Transaction);

        if (importResult.importedAccounts.length !== 1) throw new ImportError('IMPORT_FAILED', 'Only one account must be imported');

        const account = importResult.importedAccounts[0];
        if (!account.id) {
            account.id = moneyAccountRepo.save(account);
        }

        // Create transactions
        for (const tx of importResult.importedTransactions) {
            if (!tx.isNew) continue;
            const transaction = TransactionSchema.parse({
                accountId: account.id as Transaction["accountId"],
                title: tx.description,
                narration: tx.description,
                transactionAt: tx.date,
                amount: tx.amount,
                hash: tx.hash!,
            });
            transactionRepo.save(transaction);
        }
    }
}
import { Utils } from "@/modules/common/Utils";
import { EntityName } from "../entities/entities";
import type { MoneyAccount } from "../entities/MoneyAccount";
import { TransactionSchema, type Transaction, type TransactionSource } from "../entities/Transaction";
import type { IBank } from "../import/interfaces/IBank";
import type { IBankOffering } from "../import/interfaces/IBankOffering";
import type { IImportStore } from "../import/interfaces/IImportStore";
import type { AccountDetails, ImportSource, ImportTransaction, TransactionDetails } from "../import/interfaces/ImportData";
import { BaseService } from "./BaseService";
import { SettingService } from "./SettingService";

export class ImportStoreService extends BaseService implements IImportStore {

    private settingsService = new SettingService();

    async getStoredPasswords(): Promise<string[]> {
        const storedPasswords = await this.settingsService.get("import.storedPasswords");
        try {
            return Utils.parseJson(storedPasswords)
        } catch {
            return [];
        }
    }

    async storePassword(password: string): Promise<void> {
        const storedPasswords = await this.getStoredPasswords();
        if (!storedPasswords.includes(password)) {
            storedPasswords.push(password);
            await this.settingsService.update("import.storedPasswords", Utils.stringifyJson(storedPasswords));
        }
    }

    async findMatchingAccounts(_b: IBank, _o: IBankOffering, details: AccountDetails): Promise<string[]> {
        const accountRepo = this.repository(EntityName.MoneyAccount);
        const allAccounts = await accountRepo.getAll() as MoneyAccount[];
        return allAccounts
            .filter(a => a.identifiers.some(id => details['accountNumber'].includes(id)))
            .map(a => a.id!);
    }

    async isExistingTransaction(_: AccountDetails, transaction: TransactionDetails, hash: number): Promise<boolean> {
        const transactionsRepo = this.repository(EntityName.Transaction);
        const transactions = await transactionsRepo.getAll({ years: [transaction.date.getFullYear()] }) as Transaction[];

        return transactions.some(tx => tx.hash === hash);
    }

    createAccount(bank: IBank, offering: IBankOffering, details: AccountDetails): Promise<string> {
        const accountRepo = this.repository(EntityName.MoneyAccount);
        const account = {
            bankId: bank.id,
            offeringId: offering.id,
            accountNumber: details['accountNumber'][0],
            initialBalance: 0,
            identifiers: [details['accountNumber'][0]],
            active: true,
        } as MoneyAccount;
        account.id = accountRepo.save(account);
        return Promise.resolve(account.id) as Promise<string>;
    }

    addTransactions(source: ImportSource, accountId: string, transactions: ImportTransaction[]): Promise<void> {
        const transactionRepo = this.repository(EntityName.Transaction);
        for (const tx of transactions) {
            const transaction: Transaction = TransactionSchema.parse({
                accountId: accountId as Transaction['accountId'],
                title: '',
                narration: tx.description,
                transactionAt: tx.date,
                amount: tx.amount,
                hash: tx.hash,
                source: this.toTransactionSource(source),
            });
            transactionRepo.save(transaction);
        }
        return Promise.resolve();
    }

    private toTransactionSource(source: ImportSource): TransactionSource {
        switch (source.type) {
            case 'email':
                return { type: 'email', authAccountId: source.account.id, emailMessage: source.email };
            case 'file':
                return { type: 'file', fileName: source.fileName };
        }
    }

}
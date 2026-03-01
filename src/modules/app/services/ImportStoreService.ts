import type { IAuthToken } from "@/modules/auth/interfaces/IAuthToken";
import type { IAuthUser } from "@/modules/auth/interfaces/IAuthUser";
import { Utils } from "@/modules/common/Utils";
import type { IBank } from "@/modules/import/interfaces/IBank";
import type { IBankOffering } from "@/modules/import/interfaces/IBankOffering";
import type { IImportStore } from "@/modules/import/interfaces/IImportStore";
import type { AccountDetails, EmailImportState, ImportSource, ImportTransaction, TransactionDetails } from "@/modules/import/interfaces/ImportData";
import type { AuthAccount } from "../entities/AuthAccount";
import type { EmailImportSetting } from "../entities/EmailImportSetting";
import { EntityName } from "../entities/entities";
import type { MoneyAccount, MoneyAccountMetadata } from "../entities/MoneyAccount";
import { TransactionSchema, type Transaction, type TransactionSource } from "../entities/Transaction";
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

    async findMatchingAccounts(bank: IBank, offering: IBankOffering, details: AccountDetails): Promise<string[]> {
        const accountRepo = this.repository(EntityName.MoneyAccount);
        const allAccounts = await accountRepo.getAll() as MoneyAccount[];
        return allAccounts
            .filter(a =>
                a.bankId === bank.id &&
                a.offeringId === offering.id &&
                a.metadata?.accountNumber?.some(accNum => details.accountNumber.includes(accNum))
            )
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
            active: true,
            metadata: this.buildMetadata(details),
        } as MoneyAccount;
        account.id = accountRepo.save(account);
        return Promise.resolve(account.id) as Promise<string>;
    }

    async updateAccountDetails(accountId: string, details: AccountDetails): Promise<void> {
        const accountRepo = this.repository(EntityName.MoneyAccount);
        const account = await accountRepo.get(accountId) as MoneyAccount | null;
        if (!account) return;

        const existingMetadata = account.metadata ?? {};
        const newMetadata = this.buildMetadata(details);
        const mergedMetadata: MoneyAccountMetadata = { ...existingMetadata };
        for (const key of Object.keys(newMetadata) as (keyof MoneyAccountMetadata)[]) {
            const incoming = newMetadata[key];
            if (!incoming || incoming.length === 0) continue;
            const existing = mergedMetadata[key] ?? [];
            mergedMetadata[key] = [...new Set([...existing, ...incoming])];
        }

        if (JSON.stringify(mergedMetadata) === JSON.stringify(existingMetadata)) return;

        account.metadata = mergedMetadata;
        accountRepo.save(account);
    }

    /** Build a MoneyAccountMetadata object from AccountDetails, omitting empty entries. */
    private buildMetadata(details: AccountDetails): MoneyAccountMetadata {
        const result: MoneyAccountMetadata = {};
        for (const key of Object.keys(details) as (keyof MoneyAccountMetadata)[]) {
            const values = details[key as keyof AccountDetails];
            if (values && values.length > 0) result[key] = values;
        }
        return result;
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

    async updateToken(account: IAuthUser, token: IAuthToken): Promise<void> {
        const authAccount = await this.getAuthAccountByUserId(account.id);
        if (!authAccount) return;
        authAccount.token = token;
        const authAccountRepo = this.repository(EntityName.AuthAccount);
        authAccountRepo.save(authAccount);
    }

    async updateSyncState(userId: string, state: EmailImportState): Promise<void> {
        const authAccount = await this.getAuthAccountByUserId(userId);
        if (!authAccount) return;
        const importRepo = this.repository(EntityName.EmailImportSetting);
        const filteredSettings = await importRepo.getAll({ where: { authAccountId: authAccount.id } }) as EmailImportSetting[];
        if (filteredSettings.length === 0) return;
        const settings = filteredSettings[0];
        settings.importState = state;
        importRepo.save(settings);
    }

    private async getAuthAccountByUserId(userId: string): Promise<AuthAccount | null> {
        const authAccountRepo = this.repository(EntityName.AuthAccount);
        const accounts = await authAccountRepo.getAll() as AuthAccount[];
        return accounts.find(a => a.user.id === userId) || null;
    }

    private toTransactionSource(source: ImportSource): TransactionSource {
        switch (source.type) {
            case 'email':
                return {
                    type: 'email',
                    authAccountId: source.user.id,
                    emailId: source.email.id,
                    date: source.email.date,
                    from: source.email.from,
                    to: source.user.email,
                    subject: source.email.subject,
                };

            case 'file':
                return {
                    type: 'file',
                    fileName: source.file.name,
                    fileType: source.file.type
                };
        }
    }

}
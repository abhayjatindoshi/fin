import type { IBank } from "./IBank";
import type { IBankOffering } from "./IBankOffering";
import type { AccountDetails, ImportSource, ImportTransaction, TransactionDetails } from "./ImportData";

export interface IImportStore {
    getStoredPasswords(): Promise<string[]>;
    storePassword(password: string): Promise<void>;
    findMatchingAccounts(bank: IBank, offering: IBankOffering, details: AccountDetails): Promise<string[]>;
    isExistingTransaction(accountDetails: AccountDetails, transaction: TransactionDetails, hash: number): Promise<boolean>;
    createAccount(bank: IBank, offering: IBankOffering, details: AccountDetails): Promise<string>;
    addTransactions(source: ImportSource, accountId: string, transactions: ImportTransaction[]): Promise<void>;
}
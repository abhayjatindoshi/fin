import type { IAuthToken } from "@/modules/auth/interfaces/IAuthToken";
import type { IAuthUser } from "@/modules/auth/interfaces/IAuthUser";
import type { IBank } from "./IBank";
import type { IBankOffering } from "./IBankOffering";
import type { AccountDetails, EmailImportState, ImportSource, ImportTransaction, TransactionDetails } from "./ImportData";

export interface IImportStore {
    getStoredPasswords(): Promise<string[]>;
    storePassword(password: string): Promise<void>;
    findMatchingAccounts(bank: IBank, offering: IBankOffering, details: AccountDetails): Promise<string[]>;
    isExistingTransaction(accountDetails: AccountDetails, transaction: TransactionDetails, hash: number): Promise<boolean>;
    createAccount(bank: IBank, offering: IBankOffering, details: AccountDetails): Promise<string>;
    addTransactions(source: ImportSource, accountId: string, transactions: ImportTransaction[]): Promise<void>;
    updateToken(account: IAuthUser, token: IAuthToken): Promise<void>;
    updateSyncState(userId: string, state: EmailImportState): Promise<void>;
}
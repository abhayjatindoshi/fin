import type { MailMessage } from "@/modules/auth/interfaces/features/IAuthMailHandler";
import type { IAuthUser } from "@/modules/auth/interfaces/IAuthUser";
import type { IBank } from "./IBank";
import type { IBankOffering } from "./IBankOffering";

export type ImportData = {
    account: AccountDetails;
    transactions: TransactionDetails[];
}

export type TransactionDetails = {
    date: Date;
    description: string;
    amount: number;
}

export type ImportTransaction = TransactionDetails & {
    isNew: boolean;
    hash: number;
}

const identifiers = [
    "accountHolderName",
    "accountNumber",
    "ifscCode",
    "swiftCode",
];

type IdentifierKeys = typeof identifiers[number];

export type AccountDetails = Record<IdentifierKeys, string[]>;

export type EmailImportSource = {
    type: 'email';
    account: IAuthUser,
    email: MailMessage;
}

export type FileImportSource = {
    type: 'file';
    fileName: string;
}

export type ImportSource = EmailImportSource | FileImportSource;

export type ImportResult = {
    bank: IBank;
    offering: IBankOffering;
    accountDetails: AccountDetails;
    importSource: ImportSource;
    transactions: ImportTransaction[]; // ??
    account: any; // ??
}
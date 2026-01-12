import type { MailAttachment, MailMessage } from "@/modules/auth/interfaces/features/IAuthMailHandler";
import type { IAuthUser } from "@/modules/auth/interfaces/IAuthUser";
import type { PromptErrorType } from "../errors/PromptError";

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
    user: IAuthUser;
    email: MailMessage;
    attachment?: MailAttachment;
}

export type FileImportSource = {
    type: 'file';
    file: File;
}

export type ImportSource = EmailImportSource | FileImportSource;

export type ImportPoint = {
    id: string;
    date: Date;
}

export interface ImportError {
    type: PromptErrorType;
    message: string;
    promptErrorData: Record<string, any>;
}

export type EmailImportState = {
    startPoint?: ImportPoint;
    currentPoint?: ImportPoint;
    endPoint?: ImportPoint;
    readEmailCount?: number;
    importedEmailCount?: number;
    lastImportAt?: Date;
    lastError?: ImportError;
}
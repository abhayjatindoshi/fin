import type { ImportData } from "./ImportData";

export interface IEmailImportAdapter {
    supportedEmailDomains: string[];
    isEmailSupported: (email: string) => Promise<boolean>;
    readEmail: (email: string) => Promise<ImportData>;
}
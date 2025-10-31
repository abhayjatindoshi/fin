import type { IImportAdapter } from "./IImportAdapter";
import type { ImportData } from "./ImportData";

export interface IEmailImportAdapter extends IImportAdapter {
    supportedEmailDomains: string[];
    isEmailSupported: (email: string) => Promise<boolean>;
    readEmail: (email: string) => Promise<ImportData>;
}
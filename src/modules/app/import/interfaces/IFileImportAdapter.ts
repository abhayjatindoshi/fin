import type { IImportAdapter } from "./IImportAdapter";
import type { ImportData } from "./ImportData";

export interface IFileImportAdapter extends IImportAdapter {
    supportedFileTypes: string[];
    isFileSupported: (file: File, possiblePasswords?: string[]) => Promise<boolean>;
    readFile: (file: File, possiblePasswords?: string[]) => Promise<ImportData>;
}
import type { IImportAdapter } from "./IImportAdapter";
import type { ImportData } from "./ImportData";

export type FileType = "pdf" | "excel";

export interface IFile {
    name: string;
    type: FileType;
}

export interface IFileImportAdapter<T extends IFile> extends IImportAdapter {
    type: "file";
    fileType: FileType;
    isSupported(file: T): boolean;
    read: (file: T) => Promise<ImportData>;
}
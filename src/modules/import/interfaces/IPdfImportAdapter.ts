import type { IFile, IFileImportAdapter } from "./IFileImportAdapter";

export interface IPdfFile extends IFile {
    type: "pdf";
    pages: string[][];
}

export interface IPdfImportAdapter extends IFileImportAdapter<IPdfFile> {
    fileType: "pdf";
}
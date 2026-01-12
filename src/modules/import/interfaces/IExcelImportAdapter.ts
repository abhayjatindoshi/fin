import type { IFile, IFileImportAdapter } from "./IFileImportAdapter";

export interface IExcelSheet {
    name: string;
    data: string[][];
}

export interface IExcelFile extends IFile {
    type: "excel";
    sheets: IExcelSheet[];
}


export interface IExcelImportAdapter extends IFileImportAdapter<IExcelFile> {
    fileType: "excel";
}
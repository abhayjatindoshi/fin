import { ImportProcessContext } from "./ImportProcessContext";

export class FileImportProcessContext extends ImportProcessContext {
    files: File[];

    constructor(files: File[]) {
        super('file');
        this.files = files;
    }
}
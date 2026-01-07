import type { ImportSource } from "../interfaces/ImportData";
import { ImportProcessContext } from "./ImportProcessContext";

export class FileImportProcessContext extends ImportProcessContext {
    file: File;

    constructor(file: File) {
        super('file');
        this.file = file;
    }

    getSource(): ImportSource {
        return {
            type: 'file',
            fileName: this.file.name,
        }
    }
}
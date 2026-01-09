import type { ImportSource } from "../interfaces/ImportData";
import { ImportProcessContext } from "./ImportProcessContext";

export class FileImportProcessContext extends ImportProcessContext {
    file: File;

    constructor(file: File, requireConfirmation: boolean = true) {
        super('file');
        this.file = file;
        this.requireConfirmation = requireConfirmation;
    }

    getSource(): ImportSource {
        return {
            type: 'file',
            fileName: this.file.name,
        }
    }
}
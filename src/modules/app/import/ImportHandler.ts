import { FileUtils } from "../common/FileUtils";
import { HdfcSavingsAccount } from "./adapters/hdfc/HdfcSavingsAccount";
import type { IEmailImportAdapter } from "./interfaces/IEmailImportAdapter";
import type { IFileImportAdapter } from "./interfaces/IFileImportAdapter";
import type { IImportAdapter } from "./interfaces/IImportAdapter";

export class ImportHandler {

    private static fileAdapterMap: Record<string, IFileImportAdapter> = {};
    private static emailAdapters: Record<string, IEmailImportAdapter> = {};

    public static registerEmailAdapter(adapter: IEmailImportAdapter): void {
        ImportHandler.emailAdapters[adapter.name] = adapter;
    }

    public static registerFileAdapter(adapter: IFileImportAdapter): void {
        ImportHandler.fileAdapterMap[adapter.name] = adapter;
    }

    public static getSupportedFileAdapters(file: File): IFileImportAdapter[] {
        return Object.values(ImportHandler.fileAdapterMap).filter(adapter =>
            FileUtils.fileTypeMatch(file, adapter.supportedFileTypes)
        );
    }

    public static getAllAdapterMeta(): Record<string, IImportAdapter> {
        return [
            ...Object.values(this.fileAdapterMap),
            ...Object.values(this.emailAdapters)]
            .map(a => a as IImportAdapter)
            .reduce((obj, a) => {
                obj[a.name] = a;
                return obj
            }, {} as Record<string, IImportAdapter>);
    }

    public static getFileAdapterByName(name: string): IFileImportAdapter | undefined {
        return ImportHandler.fileAdapterMap[name];
    }
}

ImportHandler.registerFileAdapter(new HdfcSavingsAccount());
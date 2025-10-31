import { FileUtils } from "../common/FileUtils";
import { HdfcSavingsAccount } from "./adapters/hdfc/HdfcSavingsAccount";
import type { IEmailImportAdapter } from "./interfaces/IEmailImportAdapter";
import type { IFileImportAdapter } from "./interfaces/IFileImportAdapter";

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

    public static getFileAdapterByName(name: string): IFileImportAdapter | undefined {
        return ImportHandler.fileAdapterMap[name];
    }
}

ImportHandler.registerFileAdapter(new HdfcSavingsAccount());
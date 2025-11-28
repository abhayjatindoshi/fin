import { FederalBankCreditCard } from "./adapters/federal/FederalBankCreditCard";
import { HdfcBankAccount } from "./adapters/hdfc/HdfcBankAccount";
import { JupiterBankAccount } from "./adapters/jupiter/JupiterBankAccount";
import type { IEmailImportAdapter } from "./interfaces/IEmailImportAdapter";
import type { IFileImportAdapter } from "./interfaces/IFileImportAdapter";
import type { IImportAdapter } from "./interfaces/IImportAdapter";

export class ImportMatrix {

    static adapters: Record<string, IImportAdapter> = {};
    static fileAdapters: Record<string, IFileImportAdapter> = {};
    static emailAdapters: Record<string, IEmailImportAdapter> = {};


    static init() {
        const adapters = [
            new HdfcBankAccount(),
            new JupiterBankAccount(),
            new FederalBankCreditCard(),
        ]

        adapters.forEach(adapter => {
            ImportMatrix.adapters[adapter.name] = adapter;
            if (adapter instanceof IFileImportAdapter) {
                ImportMatrix.fileAdapters[adapter.name] = adapter;
            }
        });;
    }
}
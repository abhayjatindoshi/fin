import { EntityUtils } from "../common/EntityUtils";
import { FileUtils } from "../common/FileUtils";
import { FileImportProcessContext } from "./context/FileImportProcessContext";
import type { ImportProcessContext } from "./context/ImportProcessContext";
import { CancelledError } from "./errors/CancelledError";
import { AccountSelectionError, AdapterSelectionError, FilePasswordError, PromptError, RequireConfirmation } from "./errors/PromptError";
import { ImportMatrix } from "./ImportMatrix";
import type { IBank } from "./interfaces/IBank";
import type { IBankOffering } from "./interfaces/IBankOffering";
import type { IFile, IFileImportAdapter } from "./interfaces/IFileImportAdapter";
import type { IImportAdapter } from "./interfaces/IImportAdapter";
import type { IImportStore } from "./interfaces/IImportStore";
import type { AccountDetails, ImportData, ImportTransaction, TransactionDetails } from "./interfaces/ImportData";
import type { IPdfFile } from "./interfaces/IPdfImportAdapter";

export class ImportService {

    private static instance: ImportService | null = null;

    static initialize(store: IImportStore): void {
        ImportService.instance = new ImportService(store);
    }

    static getInstance(): ImportService {
        if (!ImportService.instance) {
            throw new Error("ImportService not initialized");
        }
        return ImportService.instance;
    }

    store: IImportStore;

    private constructor(store: IImportStore) {
        this.store = store;
    }

    async execute(context: ImportProcessContext): Promise<void> {
        try {
            await this.runSync(context);
            context.status = 'completed';
        } catch (error) {
            if (!(error instanceof Error)) throw error;
            context.error = error;
            if (error instanceof PromptError) {
                context.status = 'prompt_error';
            } else if (error instanceof CancelledError) {
                context.status = 'cancelled';
            } else {
                context.status = 'error';
            }
        }
    }

    private async runSync(context: ImportProcessContext): Promise<void> {
        if (context.status === 'completed') return;
        context.status = 'in_progress';

        this.handleCancellation(context);
        switch (context.type) {
            case 'file': {
                const fileContext = context as FileImportProcessContext;
                const [adapter, importData] = await this.processFile(fileContext);
                this.handleCancellation(context);
                await this.processImportData(context, adapter, importData);
                break;
            }
            case 'email':
                throw new Error("Email import not implemented yet");
        }

    }

    private async processFile(context: FileImportProcessContext): Promise<[IImportAdapter, ImportData]> {
        const fileData = await this.readFile(context);
        this.handleCancellation(context);

        const adapter = this.getFileAdapter(context, fileData);
        this.handleCancellation(context);

        const data = await adapter.read(fileData);
        this.handleCancellation(context);

        return [adapter, data];
    }

    private async processImportData(context: ImportProcessContext, adapter: IImportAdapter, importData: ImportData): Promise<void> {
        context.adapter = adapter;
        context.data = importData;
        this.handleCancellation(context);

        const [bank, offering] = ImportMatrix.AdapterBankData[adapter.id];
        context.selectedAccountId = await this.getAccount(context, bank, offering, importData.account);
        this.handleCancellation(context);

        context.parsedTransactions = await this.parseTransactions(importData.account, importData.transactions);
        this.handleCancellation(context);

        await this.handleConfirmation(context);

        if (!context.selectedAccountId) {
            context.selectedAccountId = await this.store.createAccount(bank, offering, importData.account);
        }

        await this.store.addTransactions(context.getSource(), context.selectedAccountId, context.parsedTransactions);
        return;
    }

    private async handleConfirmation(context: ImportProcessContext): Promise<void> {
        if (!context.requireConfirmation) return;
        if (!context.hasSelection('confirmation'))
            throw new RequireConfirmation(context);

        const confirmed = context.getSelection<boolean>('confirmation');
        if (!confirmed) {
            throw new CancelledError();
        } else {
            context.requireConfirmation = false;
        }
    }

    private async parseTransactions(accountDetails: AccountDetails, transactions: TransactionDetails[]): Promise<ImportTransaction[]> {
        const parsedTransactions: ImportTransaction[] = [];
        for (const tx of transactions) {
            const hash = EntityUtils.hashTransaction(tx.date, tx.amount, tx.description);
            const isExisting = await this.store.isExistingTransaction(accountDetails, tx, hash);
            parsedTransactions.push({
                ...tx,
                isNew: !isExisting,
                hash: hash,
            });
        }
        return parsedTransactions;
    }

    private getFileAdapter(context: ImportProcessContext, file: IFile): IFileImportAdapter<any> {

        const selectedAdapter = context.getSelection<IImportAdapter>('adapter');
        if (selectedAdapter) {
            return selectedAdapter as IFileImportAdapter<any>;
        }

        const supportedAdapters = Object.values(ImportMatrix.Adapters)
            .filter(a => a.type === 'file')
            .map(a => a as IFileImportAdapter<any>)
            .filter(a => a.fileType === file.type)
            .filter(a => a.isSupported(file))

        if (supportedAdapters.length === 0) {
            throw new Error("No supported adapter found for this file");
        } else if (supportedAdapters.length > 1) {
            throw new AdapterSelectionError(context, supportedAdapters);
        } else {
            return supportedAdapters[0];
        }
    }

    private async getAccount(context: ImportProcessContext, bank: IBank, offering: IBankOffering, details: AccountDetails): Promise<string | null> {

        const selectedAccountId = context.getSelection<string>('account');
        if (selectedAccountId) {
            return selectedAccountId;
        }

        const matchingAccountIds = await this.store.findMatchingAccounts(bank, offering, details);
        if (matchingAccountIds.length === 0) {
            return null;
        } else if (matchingAccountIds.length > 1) {
            throw new AccountSelectionError(context, matchingAccountIds);
        } else {
            return matchingAccountIds[0];
        }
    }

    private async readFile(context: FileImportProcessContext): Promise<IFile> {
        if (context.file.type === 'application/pdf' || context.file.name.toLowerCase().endsWith('.pdf')) {
            return this.readPdfFile(context);
        }
        throw new Error("Unsupported file type");
    }

    private async readPdfFile(context: FileImportProcessContext): Promise<IFile> {
        const passwords = await this.store.getStoredPasswords();
        for (const password of passwords) {
            try {
                const pages = await FileUtils.readPdfFile(context.file, password);
                const pdfFile: IPdfFile = {
                    name: context.file.name,
                    type: 'pdf',
                    pages: pages
                }
                return pdfFile;
            } catch {
                continue;
            }
        }
        throw new FilePasswordError(context);
    }

    private handleCancellation(context: ImportProcessContext): void {
        if (context.isCancelled()) {
            throw new CancelledError();
        }
    }
}
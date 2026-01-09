import { AuthMatrix } from "@/modules/auth/AuthMatrix";
import type { IAuthMailHandler, MailAttachment, MailMessage } from "@/modules/auth/interfaces/features/IAuthMailHandler";
import { EntityUtils } from "../common/EntityUtils";
import { FileUtils } from "../common/FileUtils";
import type { AuthToken } from "../entities/AuthAccount";
import type { EmailImportProcessContext } from "./context/EmailImportProcessContext";
import { FileImportProcessContext } from "./context/FileImportProcessContext";
import type { ImportProcessContext } from "./context/ImportProcessContext";
import { CancelledError } from "./errors/CancelledError";
import { AccountSelectionError, AdapterSelectionError, FilePasswordError, PromptError, RequireConfirmation } from "./errors/PromptError";
import { ImportMatrix } from "./ImportMatrix";
import type { IBank } from "./interfaces/IBank";
import type { IBankOffering } from "./interfaces/IBankOffering";
import type { IEmailImportAdapter } from "./interfaces/IEmailImportAdapter";
import type { IFile, IFileImportAdapter } from "./interfaces/IFileImportAdapter";
import type { IImportAdapter } from "./interfaces/IImportAdapter";
import type { IImportStore } from "./interfaces/IImportStore";
import type { AccountDetails, ImportTransaction } from "./interfaces/ImportData";
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
                await this.processFile(fileContext);
                this.handleCancellation(context);
                await this.processImportData(context);
                break;
            }
            case 'email':
                const emailContext = context as EmailImportProcessContext;
                await this.processEmails(emailContext);
                this.handleCancellation(context);
                break;
        }
    }

    private async processEmails(context: EmailImportProcessContext): Promise<void> {
        const handler = AuthMatrix.FeatureHandlers['mail'][context.token.handlerId] as IAuthMailHandler;
        const supportedDomains = Object.values(ImportMatrix.Adapters).filter(a => a.type === 'email').map(a => (a as IEmailImportAdapter).supportedEmailDomains).flat();
        let nextToken: string | undefined = undefined;
        const state = context.state;
        do {
            const token = await this.getToken(context);
            const mailList = await handler.getMailListing(
                token, supportedDomains,
                state.currentPoint, nextToken
            );
            nextToken = mailList.nextPageToken;

            if (mailList.messages.length === 0) break;

            if (state.startPoint === undefined) {
                const firstMessage = mailList.messages[0];
                state.startPoint = {
                    id: firstMessage.id,
                    date: firstMessage.date,
                };
                await this.store.updateSyncState(context.user.id, state);
            }

            for (const mail of mailList.messages) {

                if (state.endPoint && mail.id === state.endPoint.id) {
                    nextToken = undefined;
                    break;
                }

                context.adapter = await this.getMailAdapter(context, mail);
                if (!context.adapter) continue;

                const result = await context.adapter.readEmail(mail);
                if (result === null) {
                    continue;
                } else if (result instanceof Array) {
                    await this.processEmailAttachments(context, mail, result);
                } else {
                    context.data = result;
                    await this.processImportData(context);
                }

                state.currentPoint = {
                    id: mail.id,
                    date: mail.date,
                };
                state.importedEmailCount = (state.importedEmailCount || 0) + 1;
                await this.store.updateSyncState(context.user.id, state);
            }

            state.lastImportAt = new Date();
            state.readEmailCount = (state.readEmailCount || 0) + mailList.messages.length;
            await this.store.updateSyncState(context.user.id, state);
            await new Promise(resolve => setTimeout(resolve, 1 * 60 * 1000)); // wait for a minute
        } while (true);

        state.endPoint = state.startPoint;
        state.startPoint = undefined;
        state.currentPoint = undefined;
        await this.store.updateSyncState(context.user.id, state);
    }

    private async processEmailAttachments(context: EmailImportProcessContext, mail: MailMessage, attachments: MailAttachment[]): Promise<void> {
        const handler = AuthMatrix.FeatureHandlers['mail'][context.token.handlerId] as IAuthMailHandler;

        for (const attachment of attachments) {
            const token = await this.getToken(context);
            const file = await handler.fetchAttachment(token, mail.id, attachment);
            const fileContext = new FileImportProcessContext(file, false);
            await this.processFile(fileContext);
            context.data = fileContext.data;
            await this.processImportData(context);
        }
    }

    private async getToken(context: EmailImportProcessContext): Promise<AuthToken> {
        const handler = AuthMatrix.FeatureHandlers['mail'][context.token.handlerId] as IAuthMailHandler;
        const validToken = await handler.getValidToken(context.token);
        this.store.updateToken(context.user, validToken);
        context.token = validToken;
        return validToken;
    }

    private async processFile(context: FileImportProcessContext): Promise<void> {
        if (context.data) return;

        const fileData = await this.readFile(context);
        this.handleCancellation(context);

        const fileAdapter = this.getFileAdapter(context, fileData);
        context.adapter = fileAdapter;
        this.handleCancellation(context);

        context.data = await fileAdapter.read(fileData);
        this.handleCancellation(context);
    }

    private async processImportData(context: ImportProcessContext): Promise<void> {
        if (!context.data) throw new Error("No import data available");
        if (!context.adapter) throw new Error("No import adapter selected");

        const [bank, offering] = ImportMatrix.AdapterBankData[context.adapter.id];
        context.selectedAccountId = await this.getAccount(context, bank, offering, context.data.account);
        this.handleCancellation(context);

        context.parsedTransactions = await this.parseTransactions(context);
        this.handleCancellation(context);

        await this.handleConfirmation(context);

        if (!context.selectedAccountId) {
            context.selectedAccountId = await this.store.createAccount(bank, offering, context.data.account);
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

    private async parseTransactions(context: ImportProcessContext): Promise<ImportTransaction[]> {
        if (context.parsedTransactions) return context.parsedTransactions;
        if (!context.data) throw new Error("No import data available");

        const parsedTransactions: ImportTransaction[] = [];
        for (const tx of context.data.transactions) {
            const hash = EntityUtils.hashTransaction(tx.date, tx.amount, tx.description);
            const isExisting = await this.store.isExistingTransaction(context.data.account, tx, hash);
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

    private async getMailAdapter(context: EmailImportProcessContext, mailMessage: MailMessage): Promise<IEmailImportAdapter | null> {
        const selectedAdapter = context.getSelection<IImportAdapter>('adapter');
        if (selectedAdapter) {
            return selectedAdapter as IEmailImportAdapter;
        }

        const filteredAdapters = Object.values(ImportMatrix.Adapters)
            .filter(a => a.type === 'email')
            .map(a => a as IEmailImportAdapter)
            .filter(a => a.supportedEmailDomains.some(domain => mailMessage.from.endsWith(`@${domain}`)));

        const supportedAdapters = [];
        for (const adapter of filteredAdapters) {
            const isSupported = await adapter.isEmailSupported(mailMessage);
            if (isSupported) {
                supportedAdapters.push(adapter);
            }
        }

        if (supportedAdapters.length === 0) {
            return null;
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
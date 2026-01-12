import { AuthMatrix } from "@/modules/auth/AuthMatrix";
import type { IAuthMailHandler, MailAttachment, MailMessage } from "@/modules/auth/interfaces/features/IAuthMailHandler";
import type { IAuthToken } from "@/modules/auth/interfaces/IAuthToken";
import type { IAuthUser } from "@/modules/auth/interfaces/IAuthUser";
import { BehaviorSubject, Observable } from "rxjs";
import { EntityUtils } from "../app/common/EntityUtils";
import type { AuthToken } from "../app/entities/AuthAccount";
import { EmailImportProcessContext } from "./context/EmailImportProcessContext";
import { FileImportProcessContext } from "./context/FileImportProcessContext";
import type { ImportProcessContext } from "./context/ImportProcessContext";
import { CancelledError } from "./errors/CancelledError";
import { AccountSelectionError, AdapterSelectionError, FilePasswordError, RequireConfirmation } from "./errors/PromptError";
import { FileUtils } from "./FileUtils";
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
    private static contextMap: Record<string, ImportProcessContext> = {};
    private static contextMapSubject: BehaviorSubject<Record<string, ImportProcessContext>> = new BehaviorSubject<Record<string, ImportProcessContext>>({});

    static initialize(store: IImportStore): ImportService {
        ImportService.instance = new ImportService(store);
        return ImportService.instance;
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

    newFileContext(file: File, requireConfirmation: boolean = true): FileImportProcessContext {
        return new FileImportProcessContext(file, requireConfirmation);
    }

    newEmailContext(token: IAuthToken, user: IAuthUser, state: Record<string, any> = {}): EmailImportProcessContext {
        if (ImportService.contextMap[user.id]) return ImportService.contextMap[user.id] as EmailImportProcessContext;
        return new EmailImportProcessContext(token, user, state);
    }

    observe(): Observable<Record<string, ImportProcessContext>> {
        return ImportService.contextMapSubject.asObservable();
    }

    async execute(context: ImportProcessContext): Promise<void> {
        try {
            this.addToContextMap(context);
            await this.runSync(context);
            context.status = 'completed';
            this.removeFromContextMap(context);
        } catch (error) {
            if (!(error instanceof Error)) throw error;
            context.handleError(error);
        }
    }

    private addToContextMap(context: ImportProcessContext): void {
        ImportService.contextMap[context.identifier] = context;
        ImportService.contextMapSubject.next(ImportService.contextMap);
    }

    private removeFromContextMap(context: ImportProcessContext): void {
        delete ImportService.contextMap[context.identifier];
        ImportService.contextMapSubject.next(ImportService.contextMap);
    }

    private async runSync(context: ImportProcessContext): Promise<void> {
        if (context.status !== 'pending') return;
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
        await context.setState({
            lastError: undefined,
        })

        const handler = AuthMatrix.FeatureHandlers['mail'][context.token.handlerId] as IAuthMailHandler;
        const supportedDomains = Object.values(ImportMatrix.Adapters)
            .filter(a => a.type === 'email')
            .map(a => (a as IEmailImportAdapter).supportedEmailDomains)
            .flat();

        let nextToken: string | undefined = undefined;
        do {
            this.handleCancellation(context);
            const token = await this.getToken(context);
            const mailList = await handler.getMailListing(
                token, supportedDomains,
                context.state.currentPoint, nextToken
            );
            nextToken = mailList.nextPageToken;

            if (mailList.messages.length === 0) break;

            if (context.state.startPoint === undefined) {
                const firstMessage = mailList.messages[0];
                await context.setState({
                    startPoint: { id: firstMessage.id, date: firstMessage.date },
                    currentPoint: { id: firstMessage.id, date: firstMessage.date },
                });
            }

            if (context.state.endPoint) {
                const endPointIndex = mailList.messages.findIndex(m => m.id === context.state.endPoint?.id);
                if (endPointIndex >= 0) {
                    mailList.messages = mailList.messages.slice(0, endPointIndex);
                    nextToken = undefined;
                }
            }

            for (const mail of mailList.messages) {

                context.adapter = await this.getMailAdapter(context, mail);
                if (!context.adapter) {
                    await context.setState({
                        currentPoint: { id: mail.id, date: mail.date },
                    });
                    continue;
                }

                const result = await context.adapter.readEmail(mail);
                if (result === null) {
                    await context.setState({
                        currentPoint: { id: mail.id, date: mail.date },
                    });
                    continue;
                } else if (result instanceof Array) {
                    await this.processEmailAttachments(context, mail, result);
                } else {
                    context.data = result;
                    context.email = mail;
                    await this.processImportData(context);
                }

                await context.setState({
                    currentPoint: { id: mail.id, date: mail.date },
                    importedEmailCount: (context.state.importedEmailCount || 0) + 1,
                })
            }

            await context.setState({
                lastImportAt: new Date(),
                readEmailCount: (context.state.readEmailCount || 0) + mailList.messages.length,
            });

            if (!nextToken) break;

            await new Promise(resolve => setTimeout(resolve, handler.timeoutInMs)); // wait for timeout
        } while (true);

        await context.setState({
            endPoint: context.state.startPoint,
            startPoint: undefined,
            currentPoint: undefined,
        });
    }

    private async processEmailAttachments(context: EmailImportProcessContext, mail: MailMessage, attachments: MailAttachment[]): Promise<void> {
        const handler = AuthMatrix.FeatureHandlers['mail'][context.token.handlerId] as IAuthMailHandler;

        for (const attachment of attachments) {
            const token = await this.getToken(context);
            const file = await handler.fetchAttachment(token, mail.id, attachment);
            const fileContext = new FileImportProcessContext(file, false);
            context.email = mail;
            context.attachment = attachment;
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

        const newTransactions = context.parsedTransactions.filter(tx => tx.isNew);
        if (newTransactions.length === 0) return;
        await this.store.addTransactions(context.getSource(), context.selectedAccountId, newTransactions);
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
            throw new AdapterSelectionError(context, supportedAdapters.map(a => a.id));
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
            throw new AdapterSelectionError(context, supportedAdapters.map(a => a.id));
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
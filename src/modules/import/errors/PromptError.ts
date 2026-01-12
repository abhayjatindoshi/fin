import { AuthMatrix } from "@/modules/auth/AuthMatrix";
import type { IAuthMailHandler, MailAttachment } from "@/modules/auth/interfaces/features/IAuthMailHandler";
import { FileUtils } from "@/modules/import/FileUtils";
import { EmailImportProcessContext } from "../context/EmailImportProcessContext";
import { FileImportProcessContext } from "../context/FileImportProcessContext";
import type { ImportProcessContext } from "../context/ImportProcessContext";
import { ImportService } from "../ImportService";
import type { IImportAdapter } from "../interfaces/IImportAdapter";
import type { ImportError } from "../interfaces/ImportData";

export const PromptErrorTypes = [
    'account_authentication',
    'file_password',
    'adapter_selection',
    'account_selection',
    'require_confirmation',
] as const;
export type PromptErrorType = typeof PromptErrorTypes[number];

export abstract class PromptError extends Error {
    errorType: PromptErrorType;
    context: ImportProcessContext;

    constructor(errorType: PromptErrorType, context: ImportProcessContext, message: string) {
        super(message);
        this.errorType = errorType;
        this.context = context;
    }

    static restore(context: ImportProcessContext, error: ImportError): PromptError {
        switch (error.type) {
            case 'account_authentication': return AccountAuthenticationError.restore(context);
            case 'file_password': return FilePasswordError.restore(context);
            case 'adapter_selection': return AdapterSelectionError.restore(context, error);
            case 'account_selection': return AccountSelectionError.restore(context, error);
            case 'require_confirmation': return RequireConfirmation.restore(context);
        }
    }

    persist(): ImportError {
        return {
            type: this.errorType,
            message: this.message,
            promptErrorData: {},
        };
    }

    protected resolve(): void {
        this.context.error = null;
        this.context.status = 'pending';
        this.context.startOrResume();
    }
}

export class AccountAuthenticationError extends PromptError {
    constructor(context: ImportProcessContext) {
        super('account_authentication', context, `Authentication required to continue.`);
    }
    static restore(context: ImportProcessContext): AccountAuthenticationError {
        return new AccountAuthenticationError(context);
    }
}

export class FilePasswordError extends PromptError {

    private attachmentData: { emailId?: string; attachment?: MailAttachment } = {};
    private attachmentFile: File | null = null;

    constructor(context: ImportProcessContext) {
        super('file_password', context, `Password required to continue.`);
        if (context instanceof EmailImportProcessContext) {
            this.attachmentData = {
                emailId: context.email?.id,
                attachment: context.attachment || undefined,
            };
        }
    }

    static restore(context: ImportProcessContext): FilePasswordError {
        const error = new FilePasswordError(context);
        if (context instanceof EmailImportProcessContext) {
            error.attachmentData = {
                emailId: context.state.lastError?.promptErrorData.emailId,
                attachment: context.state.lastError?.promptErrorData.attachment,
            };
        }
        return error;
    }

    persist(): ImportError {
        const base = super.persist();
        if (this.context instanceof EmailImportProcessContext) {
            base.promptErrorData.emailId = this.context.email?.id;
            base.promptErrorData.attachment = this.context.attachment;
        }
        return base;
    }

    async tryAndStorePassword(password: string): Promise<boolean> {
        try {
            if (this.context instanceof FileImportProcessContext) {
                await this.testPasswordForFileContext(this.context, password);
                ImportService.getInstance().store.storePassword(password);
            } else if (this.context instanceof EmailImportProcessContext) {
                const success = await this.testPasswordForEmailContext(this.context, password);
                if (success) {
                    ImportService.getInstance().store.storePassword(password);
                }
            }
            this.resolve();
            return true;
        } catch {
            return false;
        }
    }

    private async testPasswordForFileContext(context: FileImportProcessContext, password: string): Promise<void> {
        const file = context.file;
        await FileUtils.readPdfFile(file, password)
    }

    private async testPasswordForEmailContext(context: EmailImportProcessContext, password: string): Promise<boolean> {
        await this.ensureAttachment(context);
        if (!this.attachmentFile) return false;
        await FileUtils.readPdfFile(this.attachmentFile, password);
        return true;
    }

    private async ensureAttachment(context: EmailImportProcessContext): Promise<void> {
        if (this.attachmentFile) return;
        const emailId = this.attachmentData.emailId || context.email?.id;
        const attachment = this.attachmentData.attachment || context.attachment;
        if (!emailId || !attachment) return;
        const handler = AuthMatrix.FeatureHandlers.mail[context.token.handlerId] as IAuthMailHandler;
        if (!handler) return;
        this.attachmentFile = await handler.fetchAttachment(context.token, emailId, attachment);
    }
}

export class AdapterSelectionError extends PromptError {
    adapterIds: string[];

    constructor(context: ImportProcessContext, adapterIds: string[]) {
        super('adapter_selection', context, `Multiple adapters available for import.`);
        this.adapterIds = adapterIds;
    }

    static restore(context: ImportProcessContext, error: ImportError): AdapterSelectionError {
        return new AdapterSelectionError(context, error.promptErrorData.adapterIds);
    }

    persist() {
        const base = super.persist();
        base.promptErrorData.adapterIds = this.adapterIds;
        return base;
    }

    selectAdapter(adapter: IImportAdapter): void {
        this.context.setSelection('adapter', adapter);
        this.resolve();
    }
}

export class AccountSelectionError extends PromptError {
    accountIds: string[];

    constructor(context: ImportProcessContext, accountIds: string[]) {
        super('account_selection', context, `Multiple accounts match the imported data.`);
        this.accountIds = accountIds;
    }

    static restore(context: ImportProcessContext, error: ImportError): AccountSelectionError {
        return new AccountSelectionError(context, error.promptErrorData.accountIds);
    }

    persist() {
        const base = super.persist();
        base.promptErrorData.accountIds = this.accountIds;
        return base;
    }

    selectAccount(accountId: string): void {
        this.context.setSelection('account', accountId);
        this.resolve();
    }
}

export class RequireConfirmation extends PromptError {

    constructor(context: ImportProcessContext) {
        super('require_confirmation', context, `Confirmation required for detected account and transactions.`);
    }

    static restore(context: ImportProcessContext): RequireConfirmation {
        return new RequireConfirmation(context);
    }

    confirmImport(): void {
        this.context.setSelection('confirmation', true);
        this.resolve();
    }

    cancelImport(): void {
        this.context.setSelection('confirmation', false);
        this.resolve();
    }
}
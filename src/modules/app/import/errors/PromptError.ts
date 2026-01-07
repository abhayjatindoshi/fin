import { FileUtils } from "../../common/FileUtils";
import type { FileImportProcessContext } from "../context/FileImportProcessContext";
import type { ImportProcessContext } from "../context/ImportProcessContext";
import { ImportService } from "../ImportService";
import type { IImportAdapter } from "../interfaces/IImportAdapter";

export type PromptErrorType = 'account_authentication' | 'file_password' | 'adapter_selection' | 'account_selection' | 'require_confirmation';

export abstract class PromptError extends Error {
    errorType: PromptErrorType;
    context: ImportProcessContext;

    constructor(errorType: PromptErrorType, context: ImportProcessContext, message: string) {
        super(message);
        this.errorType = errorType;
        this.context = context;
    }

    protected resolve(): void {
        this.context.error = null;
        this.context.startOrResume();
    }
}

export class FilePasswordError extends PromptError {

    constructor(context: FileImportProcessContext) {
        super('file_password', context, `Password required for file: ${context.file.name}`);
    }

    async tryAndStorePassword(password: string): Promise<boolean> {
        try {
            const file = (this.context as FileImportProcessContext).file;
            await FileUtils.readPdfFile(file, password)
            ImportService.getInstance().store.storePassword(password);
            this.resolve();
            return true;
        } catch {
            return false;
        }
    }
}

export class AdapterSelectionError extends PromptError {
    adapters: IImportAdapter[];

    constructor(context: ImportProcessContext, adapters: IImportAdapter[]) {
        super('adapter_selection', context, `Multiple adapters available for import.`);
        this.adapters = adapters;
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

    selectAccount(accountId: string): void {
        this.context.setSelection('account', accountId);
        this.resolve();
    }
}

export class RequireConfirmation extends PromptError {


    constructor(context: ImportProcessContext) {
        super('require_confirmation', context, `Confirmation required for detected account and transactions.`);
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
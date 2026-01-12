import { nanoid } from "nanoid";
import { BehaviorSubject, type Observable } from "rxjs";
import { CancelledError } from "../errors/CancelledError";
import { PromptError } from "../errors/PromptError";
import { ImportService } from "../ImportService";
import type { IImportAdapter, ImportAdapterType } from "../interfaces/IImportAdapter";
import type { ImportData, ImportSource, ImportTransaction } from "../interfaces/ImportData";

export type ImportProcessStatus = 'pending' | 'in_progress' | 'prompt_error' | 'error' | 'completed' | 'cancelling' | 'cancelled';
export type SelectionName = 'adapter' | 'account' | 'confirmation';

export abstract class ImportProcessContext {
    type: ImportAdapterType;
    identifier: string;
    adapter: IImportAdapter | null = null;
    data: ImportData | null = null;
    error: Error | null = null;
    requireConfirmation: boolean;
    selectedAccountId: string | null = null;
    parsedTransactions: ImportTransaction[] | null = null;
    private statusSubject: BehaviorSubject<ImportProcessStatus>;
    private cancelled: boolean;
    private selectionMap: Map<SelectionName, any>;

    constructor(type: ImportAdapterType, requireConfirmation: boolean = true) {
        this.type = type;
        this.requireConfirmation = requireConfirmation;
        this.identifier = this.generateImportIdentifier();
        this.selectionMap = new Map<SelectionName, any>();
        this.statusSubject = new BehaviorSubject<ImportProcessStatus>('pending');
        this.cancelled = false;
    }

    abstract getSource(): ImportSource;

    get status(): ImportProcessStatus {
        return this.statusSubject.getValue();
    }
    set status(newStatus: ImportProcessStatus) {
        this.statusSubject.next(newStatus);
    }

    observeStatus(): Observable<ImportProcessStatus> {
        return this.statusSubject.asObservable();
    }

    cancel(): void {
        this.cancelled = true;
        this.status = 'cancelling';
    }

    isCancelled(): boolean {
        return this.cancelled;
    }

    startOrResume(): void {
        ImportService.getInstance().execute(this);
    }

    setSelection<T>(name: SelectionName, value: T): void {
        this.selectionMap.set(name, value);
    }

    getSelection<T>(name: SelectionName): T | undefined {
        return this.selectionMap.get(name) as T | undefined;
    }

    hasSelection(name: SelectionName): boolean {
        return this.selectionMap.has(name);
    }

    handleError(error: Error): void {
        if (!(error instanceof Error)) throw error;
        this.error = error;
        if (error instanceof PromptError) {
            error.context = this;
            this.status = 'prompt_error';
        } else if (error instanceof CancelledError) {
            this.status = 'cancelled';
        } else {
            this.status = 'error';
        }
    }

    private generateImportIdentifier(): string {
        return nanoid();
    }
}
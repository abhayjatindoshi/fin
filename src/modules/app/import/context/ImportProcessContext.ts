import { nanoid } from "nanoid";
import { BehaviorSubject, Observable } from "rxjs";
import type { ImportAdapterType } from "../interfaces/IImportAdapter";
import { ImportEvent } from "./ImportEvent";

export type ImportProcessStatus = 'pending' | 'in_progress' | 'prompt_error' | 'error' | 'completed' | 'cancelling' | 'cancelled';

export type PromptErrorType = 'account_authentication' | 'file_password' | 'adapter_selection';
export class PromptError extends Error {
    errorType: PromptErrorType;
    constructor(errorType: PromptErrorType, message: string) {
        super(message);
        this.errorType = errorType;
    }
}

export abstract class ImportProcessContext {
    type: ImportAdapterType;
    identifier: string;
    status: ImportProcessStatus = "pending"
    private eventSubject: BehaviorSubject<ImportEvent>;
    private eventHistory: ImportEvent[] = [];
    private promise?: Promise<void>;
    private cancelled: boolean = false;

    constructor(type: ImportAdapterType) {
        this.type = type;
        this.identifier = this.generateImportIdentifier();
        this.eventSubject = new BehaviorSubject<ImportEvent>(new ImportEvent());
    }

    emit(event: ImportEvent): void {
        this.eventHistory.push(event);
        this.eventSubject.next(event);
    }

    observe(): Observable<ImportEvent> {
        return this.eventSubject.asObservable();
    }

    cancel(): void {
        this.cancelled = true;
    }

    isCancelled(): boolean {
        return this.cancelled;
    }

    setPromise(promise: Promise<void>): void {
        this.status = 'in_progress';
        this.promise = promise;
        this.promise.then(() => {
            this.status = 'completed';
        }).catch((error) => {
            if (error instanceof PromptError) {
                this.status = 'prompt_error';
            } else {
                this.status = 'error';
            }
        });
    }

    private generateImportIdentifier(): string {
        return nanoid();
    }
}
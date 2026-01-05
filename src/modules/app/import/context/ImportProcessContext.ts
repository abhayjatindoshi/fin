import { nanoid } from "nanoid";
import { BehaviorSubject, Observable } from "rxjs";
import type { ImportAdapterType } from "../interfaces/IImportAdapter";
import { ImportEvent } from "./ImportEvent";

export abstract class ImportProcessContext {
    type: ImportAdapterType;
    identifier: string;
    private eventSubject: BehaviorSubject<ImportEvent>;
    private eventHistory: ImportEvent[] = [];

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

    private generateImportIdentifier(): string {
        return nanoid();
    }
}
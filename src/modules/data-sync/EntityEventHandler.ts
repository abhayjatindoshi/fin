import { BehaviorSubject, Observable } from "rxjs";
import type { Entity } from "./interfaces/Entity";
import type { ILogger } from "./interfaces/ILogger";
import type { EntityEvent, EntityEventType, EntityKeyEvent, EntityName } from "./interfaces/types";

export class EntityEventHandler {

    private entitySubject = new BehaviorSubject<EntityEvent | null>(null);
    private entityKeySubject = new BehaviorSubject<EntityKeyEvent | null>(null);
    private logger: ILogger;

    constructor(logger: ILogger) {
        this.logger = logger;
    }

    notifyEntityEvent<E extends Entity>(type: EntityEventType, entityKey: string, entityName: EntityName<E>, id: string): void {
        const event: EntityEvent = { type, entityKey, entityName, id };
        this.logger.v(this.constructor.name, 'EntityEvent received', event);
        this.entitySubject.next(event);
    }

    notifyEntityKeyEvent(entityKey: string): void {
        const event: EntityKeyEvent = { type: 'save', entityKey };
        this.logger.v(this.constructor.name, 'EntityKeyEvent received', event);
        this.entityKeySubject.next(event);
    }

    observeEntityChanges(): Observable<EntityEvent | null> {
        return this.entitySubject.asObservable()
    }

    observeEntityKeyChanges(): Observable<EntityKeyEvent | null> {
        return this.entityKeySubject.asObservable()
    }
}
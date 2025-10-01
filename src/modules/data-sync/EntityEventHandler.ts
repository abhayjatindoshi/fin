import { BehaviorSubject, Observable } from "rxjs";
import type { EntityUtil } from "./EntityUtil";
import type { ILogger } from "./interfaces/ILogger";
import type { EntityEvent, EntityEventType, EntityId, EntityKey, EntityKeyEvent, EntityNameOf, SchemaMap } from "./interfaces/types";

export class EntityEventHandler<U extends EntityUtil<SchemaMap>> {

    private entitySubject = new BehaviorSubject<EntityEvent<U> | null>(null);
    private entityKeySubject = new BehaviorSubject<EntityKeyEvent | null>(null);
    private logger: ILogger;

    constructor(logger: ILogger) {
        this.logger = logger;
    }

    notifyEntityEvent<N extends EntityNameOf<U>>(type: EntityEventType, entityKey: EntityKey, entityName: N, entityId: EntityId): void {
        const event: EntityEvent<U> = { type, entityKey, entityName, entityId };
        this.logger.v(this.constructor.name, 'EntityEvent received', event);
        this.entitySubject.next(event);
    }

    notifyEntityKeyEvent(entityKey: EntityKey): void {
        const event: EntityKeyEvent = { type: 'save', entityKey };
        this.logger.v(this.constructor.name, 'EntityKeyEvent received', event);
        this.entityKeySubject.next(event);
    }

    observeEntityChanges(): Observable<EntityEvent<U> | null> {
        return this.entitySubject.asObservable()
    }

    observeEntityKeyChanges(): Observable<EntityKeyEvent | null> {
        return this.entityKeySubject.asObservable()
    }
}
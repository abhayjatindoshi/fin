import { BehaviorSubject, combineLatest, map, Observable, type Observer } from "rxjs";
import type { DataManager } from "./DataManager";
import type { EntityEventHandler } from "./EntityEventHandler";
import type { EntityKeyHandler } from "./EntityKeyHandler";
import type { EntityUtil } from "./EntityUtil";
import type { Entity } from "./entities/Entity";
import type { Tenant } from "./entities/Tenant";
import type { ILogger } from "./interfaces/ILogger";
import { filterEntities, type QueryOptions } from "./interfaces/QueryOptions";
import type { EntityEvent, EntityId, EntityKey, EntityKeyEvent, EntityNameOf, EntityTypeOf, SchemaMap } from "./interfaces/types";

type EntityKeyMap<T> = Record<EntityKey, T>;
type EntityIdMap<T> = Record<EntityId, T>;
type EntityNameMap<T> = Record<string, T>;

type EntitySubjectMap = EntityKeyMap<EntityNameMap<EntityIdMap<BehaviorSubject<Entity | null>>>>;
type EntityKeySubjectMap = EntityKeyMap<EntityNameMap<BehaviorSubject<EntityIdMap<Entity>>>>;

export class ObservableManager<U extends EntityUtil<SchemaMap>, FilterOptions, T extends Tenant> {

    private logger: ILogger;
    private entityMap: EntitySubjectMap = {};
    private entityKeyMap: EntityKeySubjectMap = {};
    private dataManager: DataManager<U, FilterOptions, T>;
    private keyHandler: EntityKeyHandler<U, FilterOptions>;

    constructor(logger: ILogger, dataManager: DataManager<U, FilterOptions, T>, keyHandler: EntityKeyHandler<U, FilterOptions>, eventHandler: EntityEventHandler<U>) {
        this.logger = logger;
        this.dataManager = dataManager;
        this.keyHandler = keyHandler;
        eventHandler.observeEntityChanges().subscribe(this.handleEntityChange.bind(this));
        eventHandler.observeEntityKeyChanges().subscribe(this.handleEntityKeyChange.bind(this));
    }

    async observe<N extends EntityNameOf<U>>(entityName: N, id: string): Promise<Observable<EntityTypeOf<U, N> | null>> {
        this.logger.v(this.constructor.name, 'Observing entity', { entityName, entityId: id });
        const entityKey = this.keyHandler.getEntityKeyFromId(id);
        const entry = await this.ensureEntityEntry(entityKey, entityName, id);

        return new Observable<EntityTypeOf<U, N> | null>(subscriber => {
            const subscription = entry.subscribe(subscriber as Observer<Entity | null>);

            return () => {
                subscription.unsubscribe();
                if (!entry.observed) {
                    entry.complete();
                    delete this.entityMap[id];
                }
            };
        });
    }

    async observeAll<N extends EntityNameOf<U>>(entityName: N, options?: QueryOptions & FilterOptions): Promise<Observable<Array<EntityTypeOf<U, N>>>> {
        this.logger.v(this.constructor.name, 'Observing all entities', { entityName, options });
        const entityKeys = this.keyHandler.getEntityKeys(entityName, options);
        const entries = await this.ensureEntityKeyEntries(entityName, entityKeys);

        return new Observable<Array<EntityTypeOf<U, N>>>(subscriber => {
            const subscription = combineLatest(entries).pipe(
                map(collections => Object.assign({}, ...collections) as EntityIdMap<EntityTypeOf<U, N>>),
                map(collection => {
                    const results = Object.values(collection) as Array<EntityTypeOf<U, N>>;
                    return options ? filterEntities(results, options) : results;
                })
            ).subscribe(subscriber);

            return () => {
                subscription.unsubscribe();
                entries.forEach((entry, i) => {
                    if (entry.observed) return;
                    entry.complete();
                    delete this.entityKeyMap[entityKeys[i]];
                });
            };
        });
    }

    private async ensureEntityEntry<N extends EntityNameOf<U>>(entityKey: string, entityName: N, id: string): Promise<BehaviorSubject<Entity | null>> {
        let entry = this.getEntityEntry(entityKey, entityName, id);
        if (!entry) {
            const entity = await this.dataManager.get(entityName, id);
            entry = new BehaviorSubject<Entity | null>(entity);
            this.entityMap[entityKey] = this.entityMap[entityKey] || {};
            this.entityMap[entityKey][entityName] = this.entityMap[entityKey][entityName] || {};
            this.entityMap[entityKey][entityName][id] = entry;
        }
        return entry;
    }

    private async ensureEntityKeyEntries<N extends EntityNameOf<U>>(entityKey: N, entityKeys: string[]): Promise<BehaviorSubject<EntityIdMap<Entity>>[]> {
        const promises = entityKeys.map(key => this.ensureEntityKeyEntry(key, entityKey));
        return await Promise.all(promises);
    }

    private async ensureEntityKeyEntry<N extends EntityNameOf<U>>(entityKey: string, entityName: N): Promise<BehaviorSubject<EntityIdMap<Entity>>> {
        let entry = this.entityKeyMap[entityKey]?.[entityName];
        if (!entry) {
            const entities = await this.dataManager.getEntityKeyData(entityName, entityKey);
            entry = new BehaviorSubject<EntityIdMap<Entity>>(Object.fromEntries(entities.map(e => [e.id!, e])));
            this.entityKeyMap[entityKey] = this.entityKeyMap[entityKey] || {};
            this.entityKeyMap[entityKey][entityName] = entry;
        }
        return entry;
    }

    private getEntityEntry<N extends EntityNameOf<U>>(entityKey: string, entityName: N, id: string): BehaviorSubject<Entity | null> | null {
        return this.entityMap[entityKey]?.[entityName]?.[id] || null;
    }

    private async handleEntityChange(event: EntityEvent<U> | null): Promise<void> {
        if (!event) return;
        const { type, entityKey, entityName, entityId } = event;
        const entry = this.getEntityEntry(entityKey, entityName, entityId);

        if (entry) {
            switch (type) {
                case 'save': {
                    const entity = await this.dataManager.get(entityName, entityId);
                    entry.next(entity);
                    break;
                }
                case 'delete':
                    entry.next(null);
                    break;
            }
        }

        const entityKeyEntry = this.entityKeyMap[entityKey]?.[entityName];
        if (entityKeyEntry) {
            const entities = await this.dataManager.getEntityKeyData(entityName, entityKey);
            entityKeyEntry.next(Object.fromEntries(entities.map(e => [e.id!, e])));
        }
    }

    private async handleEntityKeyChange(event: EntityKeyEvent | null): Promise<void> {
        if (!event) return;
        const { entityKey } = event;
        const entityKeyEntry = this.entityKeyMap[entityKey];
        if (entityKeyEntry) {
            for (const [entityName, subject] of Object.entries(entityKeyEntry)) {
                const entities = await this.dataManager.getEntityKeyData(entityName, entityKey);
                subject.next(Object.fromEntries(entities.map(e => [e.id!, e])));
            }
        }

        const entry = this.entityMap[entityKey];
        if (entry) {
            for (const [entityName, idMap] of Object.entries(entry)) {
                for (const [id, subject] of Object.entries(idMap)) {
                    const entity = await this.dataManager.get(entityName, id);
                    subject.next(entity);
                }
            }
        }
    }
}
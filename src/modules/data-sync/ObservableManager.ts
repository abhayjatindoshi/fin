import { BehaviorSubject, combineLatest, map, Observable, type Observer } from "rxjs";
import type { DataManager } from "./DataManager";
import type { EntityEventHandler } from "./EntityEventHandler";
import type { EntityKeyHandler } from "./EntityKeyHandler";
import type { Entity } from "./interfaces/Entity";
import type { ILogger } from "./interfaces/ILogger";
import { filterEntities, type QueryOptions } from "./interfaces/QueryOptions";
import type { EntityEvent, EntityKeyEvent, EntityName } from "./interfaces/types";

type EntityKeyMap<T> = Record<string, T>;
type EntityIdMap<T> = Record<string, T>;
type EntityNameMap<T> = Record<string, T>;

type EntitySubjectMap = EntityKeyMap<EntityNameMap<EntityIdMap<BehaviorSubject<Entity | null>>>>;
type EntityKeySubjectMap = EntityKeyMap<EntityNameMap<BehaviorSubject<EntityIdMap<Entity>>>>;

export class ObservableManager<FilterOptions> {

    private logger: ILogger;
    private entityMap: EntitySubjectMap = {};
    private entityKeyMap: EntityKeySubjectMap = {};
    private dataManager: DataManager<FilterOptions>;
    private keyHandler: EntityKeyHandler<FilterOptions>;

    constructor(logger: ILogger, dataManager: DataManager<FilterOptions>, keyHandler: EntityKeyHandler<FilterOptions>, eventHandler: EntityEventHandler) {
        this.logger = logger;
        this.dataManager = dataManager;
        this.keyHandler = keyHandler;
        eventHandler.observeEntityChanges().subscribe(this.handleEntityChange.bind(this));
        eventHandler.observeEntityKeyChanges().subscribe(this.handleEntityKeyChange.bind(this));
    }

    async observe<E extends Entity>(entityName: EntityName<E>, id: string): Promise<Observable<E | null>> {
        this.logger.v(this.constructor.name, 'Observing entity', { entityName, entityId: id });
        const entityKey = this.keyHandler.getEntityKeyFromId(id);
        const entry = await this.ensureEntityEntry(entityKey, entityName, id);

        return new Observable<E | null>(subscriber => {
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

    async observeAll<E extends Entity>(entityName: EntityName<E>, options?: QueryOptions & FilterOptions): Promise<Observable<Array<E>>> {
        this.logger.v(this.constructor.name, 'Observing all entities', { entityName, options });
        const entityKeys = this.keyHandler.getEntityKeys(entityName, options);
        const entries = await this.ensureEntityKeyEntries(entityName, entityKeys);

        return new Observable<Array<E>>(subscriber => {
            const subscription = combineLatest(entries).pipe(
                map(collections => Object.assign({}, ...collections) as EntityIdMap<Entity>),
                map(collection => {
                    const results = Object.values(collection) as Array<E>;
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

    private async ensureEntityEntry<E extends Entity>(entityKey: string, entityName: EntityName<E>, id: string): Promise<BehaviorSubject<Entity | null>> {
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

    private async ensureEntityKeyEntries<E extends Entity>(entityKey: EntityName<E>, entityKeys: string[]): Promise<BehaviorSubject<EntityIdMap<Entity>>[]> {
        const promises = entityKeys.map(key => this.ensureEntityKeyEntry(key, entityKey));
        return await Promise.all(promises);
    }

    private async ensureEntityKeyEntry<E extends Entity>(entityKey: string, entityName: EntityName<E>): Promise<BehaviorSubject<EntityIdMap<Entity>>> {
        let entry = this.entityKeyMap[entityKey]?.[entityName];
        if (!entry) {
            const entities = await this.dataManager.getEntityKeyData(entityName, entityKey);
            entry = new BehaviorSubject<EntityIdMap<Entity>>(Object.fromEntries(entities.map(e => [e.id!, e])));
            this.entityKeyMap[entityKey] = this.entityKeyMap[entityKey] || {};
            this.entityKeyMap[entityKey][entityName] = entry;
        }
        return entry;
    }

    private getEntityEntry<E extends Entity>(entityKey: string, entityName: EntityName<E>, id: string): BehaviorSubject<Entity | null> | null {
        return this.entityMap[entityKey]?.[entityName]?.[id] || null;
    }

    private async handleEntityChange(event: EntityEvent | null): Promise<void> {
        if (!event) return;
        const { type, entityKey, entityName, id } = event;
        const entry = this.getEntityEntry(entityKey, entityName, id);

        if (entry) {
            switch (type) {
                case 'save': {
                    const entity = await this.dataManager.get(entityName, id);
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
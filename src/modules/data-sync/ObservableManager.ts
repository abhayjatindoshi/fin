import { BehaviorSubject, combineLatest, map, Observable, type Observer } from "rxjs";
import type { DataManager } from "./DataManager";
import type { EntityEventHandler } from "./EntityEventHandler";
import type { EntityKeyHandler } from "./EntityKeyHandler";
import type { EntityUtil } from "./EntityUtil";
import type { Entity } from "./entities/Entity";
import type { Tenant } from "./entities/Tenant";
import type { ILogger } from "./interfaces/ILogger";
import { filterEntities, sortEntities, type QueryOptions } from "./interfaces/QueryOptions";
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
        this.logger.i(this.constructor.name, 'ObservableManager initialized');
    }

    observe<N extends EntityNameOf<U>>(entityName: N, id: string): Observable<EntityTypeOf<U, N> | null> {
        this.logger.v(this.constructor.name, 'Observing entity', { entityName, entityId: id });
        const entityKey = this.keyHandler.getEntityKeyFromId(id);
        const entry = this.ensureEntityEntry(entityKey, entityName, id);

        return new Observable<EntityTypeOf<U, N> | null>(subscriber => {
            const subscription = entry.subscribe(subscriber as Observer<Entity | null>);

            return () => {
                subscription.unsubscribe();
                if (!entry.observed) {
                    entry.complete();
                    delete this.entityMap[entityKey]?.[entityName]?.[id];
                }
            };
        });
    }

    observeAll<N extends EntityNameOf<U>>(entityName: N, options?: QueryOptions<U, N> & FilterOptions): Observable<Array<EntityTypeOf<U, N>>> {
        this.logger.v(this.constructor.name, 'Observing all entities', { entityName, options });
        const entityKeys = this.keyHandler.getEntityKeys(entityName, options);
        const entries = this.ensureEntityKeyEntries(entityName, entityKeys);

        return new Observable<Array<EntityTypeOf<U, N>>>(subscriber => {
            const subscription = combineLatest(entries).pipe(
                map(collections => Object.assign({}, ...collections) as EntityIdMap<EntityTypeOf<U, N>>),
                map(collection => {
                    const results = Object.values(collection) as Array<EntityTypeOf<U, N>>;
                    return options ? sortEntities(filterEntities(results, options), options) : results;
                })
            ).subscribe(subscriber);

            return () => {
                subscription.unsubscribe();
                entries.forEach((entry, i) => {
                    if (entry.observed) return;
                    entry.complete();
                    delete this.entityKeyMap?.[entityKeys[i]]?.[entityName];
                    if (Object.keys(this.entityKeyMap[entityKeys[i]]).length === 0) {
                        delete this.entityKeyMap[entityKeys[i]];
                    }
                });
            };
        });
    }

    private ensureEntityEntry<N extends EntityNameOf<U>>(entityKey: string, entityName: N, id: string): BehaviorSubject<Entity | null> {
        let entry = this.getEntityEntry(entityKey, entityName, id);
        if (!entry) {
            this.logger.v(this.constructor.name, 'Creating new entity entry', { entityName, id });
            entry = new BehaviorSubject<Entity | null>(null);
            this.entityMap[entityKey] = this.entityMap[entityKey] || {};
            this.entityMap[entityKey][entityName] = this.entityMap[entityKey][entityName] || {};
            this.entityMap[entityKey][entityName][id] = entry;

            void this.dataManager.get(entityName, id).then(entity => {
                this.logger.v(this.constructor.name, 'Loaded initial entity data', { entityName, id, entity: !!entity });
                entry?.next(entity);
            }).catch(err => {
                this.logger.e(this.constructor.name, 'Error observing entity', { entityName, id, err });
            });
        }
        return entry;
    }

    private ensureEntityKeyEntries<N extends EntityNameOf<U>>(entityName: N, entityKeys: string[]): BehaviorSubject<EntityIdMap<Entity>>[] {
        return entityKeys.map(entityKey => this.ensureEntityKeyEntry(entityKey, entityName));
    }

    private ensureEntityKeyEntry<N extends EntityNameOf<U>>(entityKey: string, entityName: N): BehaviorSubject<EntityIdMap<Entity>> {
        let entry = this.entityKeyMap[entityKey]?.[entityName];
        if (!entry) {
            this.logger.v(this.constructor.name, 'Creating new entity key entry', { entityName, entityKey });
            entry = new BehaviorSubject<EntityIdMap<Entity>>({});
            this.entityKeyMap[entityKey] = this.entityKeyMap[entityKey] || {};
            this.entityKeyMap[entityKey][entityName] = entry;

            void this.dataManager.getEntityKeyData(entityName, entityKey).then(entities => {
                this.logger.v(this.constructor.name, 'Loaded initial entity key data', { entityName, entityKey, count: entities.length });
                entry?.next(Object.fromEntries(entities.map(e => [e.id!, e])));
            }).catch(err => {
                this.logger.e(this.constructor.name, 'Error observing entity key', { entityName, entityKey, err });
            });
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
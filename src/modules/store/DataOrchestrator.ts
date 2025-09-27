import { combineLatest, map, type Observable } from "rxjs";
import { generateHash, sortKeys } from "../common/json";
import type { IPersistence } from "../store/interfaces/IPersistence";
import type { IStore } from "../store/interfaces/IStore";
import type { Metadata } from "./entities/Metadata";
import { type Entity, type EntityName, type EntityType } from "./interfaces/Entity";
import { EntityConfigs } from "./interfaces/EntityConfig";
import { EntityId } from "./interfaces/EntityId";
import { EntityKey } from "./interfaces/EntityKey";
import { filterEntities, type QueryOptions } from "./interfaces/QueryOptions";
import { ObservableManager } from "./ObervableManager";
import { SyncScheduler } from "./SyncScheduler";

export class DataOrchestrator {

    // =========================== Static Methods ===========================

    private static instance: DataOrchestrator | null = null;

    // Load function to initialize the singleton instance
    public static async load(prefix: string, store: IStore, local: IPersistence, cloud?: IPersistence): Promise<void> {
        if (DataOrchestrator.instance) {
            if (DataOrchestrator.instance.prefix === prefix) return;
            await DataOrchestrator.unload();
        }
        DataOrchestrator.instance = new DataOrchestrator(prefix, store, local, cloud);
        await DataOrchestrator.instance.load();
    }

    // Unload function to clear the singleton instance
    public static async unload(): Promise<void> {
        if (DataOrchestrator.instance) {
            await DataOrchestrator.instance.unload();
        }
        DataOrchestrator.instance = null;
    }

    // Get the singleton instance
    public static getInstance(): DataOrchestrator {
        if (!DataOrchestrator.instance) {
            throw new Error("DataOrchestrator is not loaded. Call load() first.");
        }
        return DataOrchestrator.instance;
    }

    // =========================== Constructor ===========================

    private prefix: string;
    private store: IStore;
    private local: IPersistence;
    private cloud?: IPersistence;
    private intervals: Array<NodeJS.Timeout> = [];
    private sync: SyncScheduler;
    private observableManagers: Map<string, ObservableManager<EntityName, EntityType<EntityName>>>;

    // Private constructor to enforce singleton pattern
    private constructor(prefix: string, store: IStore, local: IPersistence, cloud?: IPersistence) {
        this.prefix = prefix;
        this.store = store;
        this.local = local;
        this.cloud = cloud;
        this.intervals = [];
        this.sync = new SyncScheduler(this.prefix);
        this.observableManagers = new Map();
    }

    // =========================== Load/Unload ===========================

    private async load(): Promise<void> {
        if (this.cloud) await this.sync.sync(this.local, this.cloud);
        await this.sync.sync(this.local, this.store);
        this.startIntervals();
    }

    private async unload(): Promise<void> {
        this.stopIntervals();
        await this.sync.gracefullyShutdown();
        this.observableManagers.clear();
    }

    private startIntervals(): void {
        // every 2 seconds
        this.intervals.push(setInterval(() => this.sync.triggerSync(this.store, this.local), 2 * 1000));
        // every 5 minutes
        this.intervals.push(setInterval(() => this.cloud && this.sync.triggerSync(this.local, this.cloud), 5 * 60 * 1000));
    }

    private stopIntervals(): void {
        this.intervals.forEach(clearInterval);
        this.intervals = [];
    }

    // =========================== Public Methods ===========================

    public async get<N extends EntityName>(entityName: N, id: string): Promise<EntityType<N> | null> {
        const entityKey = EntityKey.fromId(this.prefix, EntityId.from(id)).toString();
        return this.store.get(entityKey, entityName, id);
    }

    public async getAll<N extends EntityName>(entityName: N, options: QueryOptions = { year: new Date().getFullYear() }): Promise<Array<EntityType<N>>> {
        const entityKeys = this.findAllEntityKeys(entityName, options.year);
        const results = await Promise.all(entityKeys.map(key => this.store.getAll(key, entityName)));
        const data = results.flat();
        return filterEntities(EntityConfigs[entityName], data, options);
    }

    public async save<N extends EntityName>(entityName: N, entity: EntityType<N>): Promise<void> {
        await this.ensureEntityId(entityName, entity);
        const entityKey = EntityKey.fromId(this.prefix, EntityId.from(entity.id || '')).toString();
        entity.createdAt = entity.createdAt || new Date();
        entity.updatedAt = new Date();
        entity.version = (entity.version || 0) + 1;
        await this.store.save(entityKey, entityName, entity);
        await this.updateStoreMetadata(entityName, entityKey);
        this.observableManagers.get(`${entityName}.${entityKey}`)?.notifyChange({ type: 'save', id: entity.id || '', entity });
    }

    public async delete<N extends EntityName>(entityName: N, id: string): Promise<void> {
        const entityKey = EntityKey.fromId(this.prefix, EntityId.from(id)).toString();
        await this.store.delete(entityKey, entityName, id);
        await this.updateStoreMetadata(entityName, entityKey);
        this.observableManagers.get(`${entityName}.${entityKey}`)?.notifyChange({ type: 'delete', id, entity: {} as EntityType<N> });
    }

    public async observe<N extends EntityName>(entityName: N, id: string): Promise<Observable<EntityType<N> | null>> {
        const entityKey = EntityKey.fromId(this.prefix, EntityId.from(id)).toString();
        await this.ensureObservableManager(entityName, entityKey);
        const observableManager = this.observableManagers.get(`${entityName}.${entityKey}`);
        if (!observableManager) throw new Error(`ObservableManager not found for ${entityName} and key ${entityKey}`);
        return observableManager.observe(id) as Observable<EntityType<N> | null>;
    }

    public async observeAll<N extends EntityName>(entityName: N, options: QueryOptions = { year: new Date().getFullYear() }): Promise<Observable<Array<EntityType<N>>>> {
        const entityKeys = this.findAllEntityKeys(entityName, options.year);
        await Promise.all(entityKeys.map(key => this.ensureObservableManager(entityName, key)));
        const observables = entityKeys
            .map(key => this.observableManagers.get(`${entityName}.${key}`)?.observeAll(options) as Observable<Array<EntityType<N>>>)
        if (observables.length === 1) return observables[0];
        return combineLatest(observables).pipe(map((arrays) => arrays.flat()));
    }

    // =========================== Private Methods ===========================

    private async ensureObservableManager(entityName: EntityName, entityKey: string): Promise<void> {
        if (this.observableManagers.has(`${entityName}.${entityKey}`)) return;
        const data = await this.store.getAll(entityKey, entityName);
        const entityMap = data.reduce((map, e) => {
            map[e.id || ''] = e; return map;
        }, {} as Record<string, EntityType<EntityName>>);
        const observableManager = new ObservableManager(entityName, entityMap);
        this.observableManagers.set(`${entityName}.${entityKey}`, observableManager);
    }

    private async ensureEntityId<N extends EntityName>(entityName: N, entity: EntityType<N> & Entity): Promise<void> {
        if (entity.id) {
            const existing = await this.get(entityName, entity.id);
            if (existing) return;
        }
        entity.id = EntityId.new(entityName, entity).toString();
    }

    private findAllEntityKeys(entityName: EntityName, year: number): string[] {
        const entityConfig = EntityConfigs[entityName];
        const entityKeys: string[] = [];
        switch (entityConfig.scope) {
            case 'monthly':
                for (let month = 1; month <= 12; month++) {
                    entityKeys.push(`${this.prefix}.${year}.${String(month).padStart(2, '0')}`);
                }
                break;
            case 'yearly':
                entityKeys.push(`${this.prefix}.${year}`);
                break;
            case 'global':
                entityKeys.push(`${this.prefix}.global`);
                break;
        }
        return entityKeys;
    }

    private async updateStoreMetadata(entityName: EntityName, entityKey: string): Promise<void> {
        const metadataKeyData = await this.store.loadData(`${this.prefix}.metadata`);
        if (!metadataKeyData || !metadataKeyData['Metadata']) return;
        const metadata = Object.values(metadataKeyData['Metadata'])[0] as Metadata | undefined;
        if (!metadata) return;

        const entityKeyData = await this.store.loadData(entityKey);
        if (!entityKeyData || !entityKeyData[entityName]) return;
        entityKeyData[entityName] = sortKeys(entityKeyData[entityName]);

        metadata.entityKeys = metadata.entityKeys || {};
        metadata.entityKeys[entityKey] = metadata.entityKeys[entityKey] || {};
        metadata.entityKeys[entityKey].entities = metadata.entityKeys[entityKey].entities || {};
        metadata.entityKeys[entityKey].entities[entityName] = metadata.entityKeys[entityKey].entities[entityName] || { count: 0, deletedCount: 0 };

        metadata.entityKeys[entityKey].updatedAt = new Date();
        metadata.entityKeys[entityKey].hash = generateHash(JSON.stringify(entityKeyData[entityName]));

        metadata.entityKeys[entityKey].entities[entityName].count = Object.keys(entityKeyData[entityName]).length;

        if (entityKeyData.deleted) {
            entityKeyData.deleted[entityName] = sortKeys(entityKeyData.deleted[entityName] || {});
            metadata.entityKeys[entityKey].entities[entityName].deletedCount = Object.keys(entityKeyData.deleted[entityName]).length;
        }

        metadata.updatedAt = new Date();
        await this.store.storeData(entityKey, entityKeyData);
        await this.store.save(`${this.prefix}.metadata`, 'Metadata', metadata);
    }
}
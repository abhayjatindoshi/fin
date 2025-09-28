import type { EntityEventHandler } from "./EntityEventHandler";
import type { EntityKeyHandler } from "./EntityKeyHandler";
import type { Entity } from "./interfaces/Entity";
import type { ILogger } from "./interfaces/ILogger";
import type { IPersistence } from "./interfaces/IPersistence";
import type { IStore } from "./interfaces/IStore";
import { filterEntities, type QueryOptions } from "./interfaces/QueryOptions";
import type { EntityName } from "./interfaces/types";
import type { MetadataManager } from "./MetadataManager";

export class DataManager<FilterOptions> {

    private logger: ILogger;
    private metadataManager: MetadataManager;
    private keyHandler: EntityKeyHandler<FilterOptions>;
    private eventHandler: EntityEventHandler;
    private store: IStore;
    private local: IPersistence;
    private cloud?: IPersistence;

    constructor(logger: ILogger, metadataManager: MetadataManager, keyHandler: EntityKeyHandler<FilterOptions>, eventHandler: EntityEventHandler, store: IStore, local: IPersistence, cloud?: IPersistence) {
        this.logger = logger;
        this.metadataManager = metadataManager;
        this.keyHandler = keyHandler;
        this.eventHandler = eventHandler;
        this.store = store;
        this.local = local;
        this.cloud = cloud;
    }

    public async get<E extends Entity>(entityName: EntityName<E>, id: string): Promise<E | null> {
        const entityKey = this.keyHandler.getEntityKeyFromId(id);
        await this.ensureEntityKey(entityKey);
        return this.store.get<E>(entityKey, entityName, id);
    }

    public async getAll<E extends Entity>(entityName: EntityName<E>, options?: QueryOptions & FilterOptions): Promise<Array<E>> {
        const entityKeys = this.keyHandler.getEntityKeys(entityName, options);
        const results = await Promise.all(entityKeys.map(entityKey => this.getFiltered(entityName, entityKey, options) as Promise<Array<E>>));
        return results.flat();
    }

    public save<E extends Entity>(entityName: EntityName<E>, entity: E): string {
        this.ensureEntityId(entityName, entity);
        const entityKey = this.keyHandler.getEntityKeyFromId(entity.id!);
        entity.createdAt = entity.createdAt || new Date();
        entity.updatedAt = new Date();
        entity.version = (entity.version || 0) + 1;
        this.store.save(entityKey, entityName, entity);
        this.logger.i(this.constructor.name, 'Entity saved', { entityKey, entityName, entityId: entity.id! });
        this.eventHandler.notifyEntityEvent('save', entityKey, entityName, entity.id!);
        return entity.id!;
    }

    public delete<E extends Entity>(entityName: EntityName<E>, id: string): void {
        const entityKey = this.keyHandler.getEntityKeyFromId(id);
        this.store.delete(entityKey, entityName, id);
        this.logger.i(this.constructor.name, 'Entity deleted', { entityKey, entityName, entityId: id });
        this.eventHandler.notifyEntityEvent('delete', entityKey, entityName, id);
    }

    async getEntityKeyData<E extends Entity>(entityName: string, entityKey: string): Promise<Array<E>> {
        await this.ensureEntityKey(entityKey);
        return this.store.getAll(entityKey, entityName);
    }

    private async getFiltered<E extends Entity>(entityName: EntityName<E>, entityKey: string, options?: QueryOptions): Promise<Array<E>> {
        await this.ensureEntityKey(entityKey);
        const results = this.store.getAll<E>(entityKey, entityName);
        return filterEntities(results, options);
    }

    private ensureEntityId<E extends Entity>(entityName: EntityName<E>, entity: E): void {
        if (entity.id) {
            const entityKey = this.keyHandler.getEntityKeyFromId(entity.id);
            const existingEntity = this.store.get(entityKey, entityName, entity.id);
            if (existingEntity) return;
        }

        this.logger.i(this.constructor.name, `Generating new ID for entity ${entityName}`);
        entity.id = this.keyHandler.generateNextId(entityName, entity);
    }

    private async ensureEntityKey(entityKey: string): Promise<void> {
        if (this.metadataManager.storeContains(entityKey)) return;
        if (this.metadataManager.localContains(entityKey)) {
            this.logger.v(this.constructor.name, 'Loading entity from local store', { entityKey });
            const data = await this.local.loadData(entityKey);
            if (data) {
                this.logger.v(this.constructor.name, 'Storing entity to main store', { entityKey });
                await this.store.storeData(entityKey, data);
            }
            return;
        }

        if (this.cloud && this.metadataManager.cloudContains(entityKey)) {
            this.logger.v(this.constructor.name, 'Loading entity from cloud store', { entityKey });
            const data = await this.cloud.loadData(entityKey);
            if (data) {
                this.logger.v(this.constructor.name, 'Storing entity to local and main store', { entityKey });
                await this.local.storeData(entityKey, data);
                await this.store.storeData(entityKey, data);
            }
        }
    }
}
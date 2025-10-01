import { Utils } from "../common/Utils";
import type { EntityEventHandler } from "./EntityEventHandler";
import type { EntityKeyHandler } from "./EntityKeyHandler";
import type { EntityUtil } from "./EntityUtil";
import type { ILogger } from "./interfaces/ILogger";
import type { IPersistence } from "./interfaces/IPersistence";
import type { IStore } from "./interfaces/IStore";
import { filterEntities, type QueryOptions } from "./interfaces/QueryOptions";
import type { EntityNameOf, EntityTypeOf, SchemaMap } from "./interfaces/types";
import type { MetadataManager } from "./MetadataManager";

export class DataManager<U extends EntityUtil<SchemaMap>, FilterOptions> {

    private logger: ILogger;
    private util: U;
    private metadataManager: MetadataManager<U>;
    private keyHandler: EntityKeyHandler<U, FilterOptions>;
    private eventHandler: EntityEventHandler<U>;
    private store: IStore<U>;
    private local: IPersistence;
    private cloud?: IPersistence;

    constructor(
        logger: ILogger, util: U, metadataManager: MetadataManager<U>,
        keyHandler: EntityKeyHandler<U, FilterOptions>, eventHandler: EntityEventHandler<U>,
        store: IStore<U>, local: IPersistence, cloud?: IPersistence
    ) {
        this.logger = logger;
        this.util = util;
        this.metadataManager = metadataManager;
        this.keyHandler = keyHandler;
        this.eventHandler = eventHandler;
        this.store = store;
        this.local = local;
        this.cloud = cloud;
    }

    public async get<N extends EntityNameOf<U>>(entityName: N, id: string): Promise<EntityTypeOf<U, N> | null> {
        const entityKey = this.keyHandler.getEntityKeyFromId(id);
        await this.ensureEntityKey(entityKey);
        return this.store.get<N>(entityKey, entityName, id);
    }

    public async getAll<N extends EntityNameOf<U>>(entityName: N, options?: QueryOptions & FilterOptions): Promise<Array<EntityTypeOf<U, N>>> {
        const entityKeys = this.keyHandler.getEntityKeys(entityName, options);
        const results = await Promise.all(
            entityKeys.map(entityKey => this.getFiltered(entityName, entityKey, options) as Promise<Array<EntityTypeOf<U, N>>>)
        );
        return results.flat();
    }

    public save<N extends EntityNameOf<U>>(entityName: N, entity: EntityTypeOf<U, N>): string {
        entity = this.util.parse(entityName, entity) as EntityTypeOf<U, N>;
        this.ensureEntityId(entityName, entity);
        const entityKey = this.keyHandler.getEntityKeyFromId(entity.id!);
        entity.createdAt = entity.createdAt || new Date();
        entity.updatedAt = new Date();
        entity.version = (entity.version || 0) + 1;
        entity = Utils.sortKeys(entity) as EntityTypeOf<U, N>;
        this.store.save(entityKey, entityName, entity);
        this.logger.i(this.constructor.name, 'Entity saved', { entityKey, entityName, entityId: entity.id! });
        this.eventHandler.notifyEntityEvent('save', entityKey, entityName, entity.id!);
        return entity.id!;
    }

    public delete<N extends EntityNameOf<U>>(entityName: N, id: string): void {
        const entityKey = this.keyHandler.getEntityKeyFromId(id);
        this.store.delete(entityKey, entityName, id);
        this.logger.i(this.constructor.name, 'Entity deleted', { entityKey, entityName, entityId: id });
        this.eventHandler.notifyEntityEvent('delete', entityKey, entityName, id);
    }

    async getEntityKeyData<N extends EntityNameOf<U>>(entityName: string, entityKey: string): Promise<Array<EntityTypeOf<U, N>>> {
        await this.ensureEntityKey(entityKey);
        return this.store.getAll(entityKey, entityName);
    }

    private async getFiltered<N extends EntityNameOf<U>>(entityName: N, entityKey: string, options?: QueryOptions): Promise<Array<EntityTypeOf<U, N>>> {
        await this.ensureEntityKey(entityKey);
        const results = this.store.getAll<N>(entityKey, entityName);
        return filterEntities(results, options);
    }

    private ensureEntityId<N extends EntityNameOf<U>>(entityName: N, entity: EntityTypeOf<U, N>): void {
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
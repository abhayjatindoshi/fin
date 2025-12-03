import { map } from "rxjs";
import { Utils } from "../common/Utils";
import type { Entity } from "./entities/Entity";
import type { EntityKeyMetadata, EntityMetadata, Metadata } from "./entities/Metadata";
import type { Tenant } from "./entities/Tenant";
import type { EntityEventHandler } from "./EntityEventHandler";
import type { EntityUtil } from "./EntityUtil";
import type { ILogger } from "./interfaces/ILogger";
import type { IPersistence } from "./interfaces/IPersistence";
import type { DeletedEntityIdRecord, EntityIdRecord, EntityKeyData, EntityNameRecord, SchemaMap } from "./interfaces/types";

type PersistenceType = "store" | "local" | "cloud";

export class MetadataManager<U extends EntityUtil<SchemaMap>, T extends Tenant> {

    private static metadataKey = 'metadata';

    private logger: ILogger;
    private tenant: T;
    private store: IPersistence<T>;
    private local: IPersistence<T>;
    private cloud?: IPersistence<T>;
    private storeKeys: string[] = [];
    private localKeys: string[] = [];
    private cloudKeys: string[] = [];
    private storeMetadata: Metadata;
    private lastHashComputeTime = new Date(0);

    constructor(logger: ILogger, tenant: T, eventHandler: EntityEventHandler<U>, store: IPersistence<T>, local: IPersistence<T>, cloud?: IPersistence<T>) {
        this.logger = logger;
        this.tenant = tenant;
        this.store = store;
        this.local = local;
        this.cloud = cloud;
        this.storeMetadata = MetadataManager.defaultMetadata();

        eventHandler.observeEntityChanges().pipe(map(event => event?.entityKey)).subscribe(this.handleEntityKeyChange.bind(this));
        eventHandler.observeEntityKeyChanges().pipe(map(event => event?.entityKey)).subscribe(this.handleEntityKeyChange.bind(this));
    }

    getMetadata(persistence: IPersistence<T>): Promise<Metadata> {
        switch (this.which(persistence)) {
            case "store":
                return this.getStoreMetadata();
            case "local":
                return this.getLocalMetadata();
            case "cloud":
                return this.getCloudMetadata();
        }
    }

    async getStoreMetadata(): Promise<Metadata> {
        this.storeMetadata = await this.getMetadataOrDefault("store");
        if (this.storeMetadata.updatedAt.getTime() > this.lastHashComputeTime.getTime()) {
            this.logger.i(this.constructor.name, 're-computing hashes for store metadata');
            await this.computeMetadataHash(this.storeMetadata, this.store);
            await this.saveMetadata(this.store, this.storeMetadata);
            this.lastHashComputeTime = new Date();
        }
        return this.storeMetadata;
    }

    getLocalMetadata = () => this.getMetadataOrDefault("local");

    getCloudMetadata = () => this.getMetadataOrDefault("cloud");

    storeContains(entityKey: string): boolean {
        return this.storeKeys.includes(entityKey);
    }

    localContains(entityKey: string): boolean {
        return this.localKeys.includes(entityKey);
    }

    cloudContains(entityKey: string): boolean {
        return this.cloudKeys.includes(entityKey);
    }

    async saveMetadata(persistence: IPersistence<T>, metadata: Metadata): Promise<void> {
        const entityKeyData = this.toEntityKeyData(metadata);
        await persistence.storeData(this.tenant, MetadataManager.metadataKey, entityKeyData);
        switch (this.which(persistence)) {
            case "store":
                this.logger.i(this.constructor.name, 'Store metadata saved', metadata);
                this.storeMetadata = metadata;
                this.storeKeys = Object.keys(this.storeMetadata.entityKeys);
                break;
            case "local":
                this.logger.i(this.constructor.name, 'Local metadata saved', metadata);
                this.localKeys = Object.keys(metadata.entityKeys);
                break;
            case "cloud":
                this.logger.i(this.constructor.name, 'Cloud metadata saved', metadata);
                this.cloudKeys = Object.keys(metadata.entityKeys);
                break;
        }
    }

    private getPersistence(type: PersistenceType): IPersistence<T> {
        switch (type) {
            case "store":
                return this.store;
            case "local":
                return this.local;
            case "cloud":
                if (!this.cloud) throw new Error("Cloud persistence is not configured");
                return this.cloud;
        }
    }

    private updateEntityKeyList(type: PersistenceType, entityKeys: string[]): void {
        switch (type) {
            case "store":
                this.storeKeys = entityKeys;
                break;
            case "local":
                this.localKeys = entityKeys;
                break;
            case "cloud":
                this.cloudKeys = entityKeys;
                break;
        }
    }

    private async getMetadataOrDefault(type: PersistenceType): Promise<Metadata> {
        this.logger.v(this.constructor.name, `Loading ${type} metadata`);
        const persistence = this.getPersistence(type);
        const data = await persistence.loadData(this.tenant, MetadataManager.metadataKey);
        let metadata: Metadata;
        if (!data) {
            this.logger.v(this.constructor.name, `No ${type} metadata found, using default`, MetadataManager.defaultMetadata);
            metadata = MetadataManager.defaultMetadata();
            await this.saveMetadata(persistence, metadata);
        } else {
            metadata = this.fromEntityKeyData(data);
        }
        const entityKeys = Object.keys(metadata.entityKeys);
        this.updateEntityKeyList(type, entityKeys);
        this.logger.v(this.constructor.name, `${type} metadata loaded`, metadata);
        return metadata;
    }

    private async computeMetadataHash(metadata: Metadata, persistence: IPersistence<T>): Promise<void> {
        const promises = Object.entries(metadata.entityKeys)
            .map(([entityKey, entityKeyData]) => this.computeEntityKeyHash(entityKey, entityKeyData, persistence));
        await Promise.all(promises);
    }

    private async computeEntityKeyHash(entityKey: string, entityKeyMetadata: EntityKeyMetadata, persistence: IPersistence<T>): Promise<void> {
        let data = await persistence.loadData(this.tenant, entityKey);
        if (!data) return;
        data = this.sortEntityKeyData(data);
        await persistence.storeData(this.tenant, entityKey, data);
        entityKeyMetadata.hash = Utils.generateHash(Utils.stringifyJson(data));
        entityKeyMetadata.entities = Object.entries(data).reduce((entityMetadata, [entityName, records]) => {
            if (!records || entityName === 'deleted') return entityMetadata;
            const count = Object.keys(records).length;
            const deletedCount = data.deleted && data.deleted[entityName] ? Object.keys(data.deleted[entityName]).length : 0;
            entityMetadata[entityName] = { count, deletedCount };
            return entityMetadata;
        }, {} as Record<string, EntityMetadata>);
    }

    private sortEntityKeyData(data: EntityKeyData): EntityKeyData {
        return Object.entries(data).reduce((data, [entityName, records]) => {
            if (!records) return data;
            if (entityName === 'deleted') {
                data.deleted = Object.entries(records).reduce((data, [deletedEntityName, deletedRecords]) => {
                    if (!deletedRecords) return data;
                    data[deletedEntityName] = Utils.sortKeys(deletedRecords as DeletedEntityIdRecord);
                    return data;
                }, {} as EntityNameRecord<DeletedEntityIdRecord>);
                return data;
            }
            data[entityName] = Utils.sortKeys(records as EntityIdRecord<Entity>);
            return data;
        }, {} as EntityKeyData);
    }

    private fromEntityKeyData(data: EntityKeyData): Metadata {
        if (!data || !data.Metadata) return MetadataManager.defaultMetadata();
        return Object.values(data.Metadata)[0] as Metadata;
    }

    private toEntityKeyData(metadata: Metadata): EntityKeyData {
        return { Metadata: { [metadata.id!]: metadata } };
    }

    private which(persistence: IPersistence<T>): PersistenceType {
        if (persistence === this.store) return "store";
        if (persistence === this.local) return "local";
        if (this.cloud && persistence === this.cloud) return "cloud";
        throw new Error("Unknown persistence");
    }

    private async handleEntityKeyChange(entityKey: string | undefined): Promise<void> {
        if (!entityKey) return;
        this.storeMetadata.updatedAt = new Date();
        this.storeMetadata.version = (this.storeMetadata.version ?? 0) + 1;
        const entityKeyMetadata = this.ensureEntityKeyMetadata(entityKey);
        entityKeyMetadata.updatedAt = new Date();
        await this.saveMetadata(this.store, this.storeMetadata);
    }

    private ensureEntityKeyMetadata(entityKey: string): EntityKeyMetadata {
        let entityKeyMetadata = this.storeMetadata.entityKeys[entityKey];
        if (!entityKeyMetadata) {
            entityKeyMetadata = { updatedAt: new Date(0), hash: 0, entities: {} };
            this.storeMetadata.entityKeys[entityKey] = entityKeyMetadata;
        }
        return entityKeyMetadata;
    }

    private static defaultMetadata(): Metadata {
        return {
            id: 'id',
            createdAt: new Date(0),
            updatedAt: new Date(0),
            version: 0,
            entityKeys: {},
        };
    }
}
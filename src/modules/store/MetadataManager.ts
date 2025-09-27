import { generateHash, sortKeys } from "../common/json";
import type { EntityKeyMetadata, Metadata } from "./entities/Metadata";
import type { EntityKeyData } from "./interfaces/EntityKeyData";
import type { IPersistence } from "./interfaces/IPersistence";
import type { IStore } from "./interfaces/IStore";

export class MetadataManager {

    private static defaultMetadata: Metadata = {
        id: 'id',
        createdAt: new Date(0),
        updatedAt: new Date(0),
        version: 0,
        entityKeys: {},
    }

    private metadataKey: string;
    private store: IStore;
    private local: IPersistence;
    private cloud?: IPersistence;
    private storeMetadata: Metadata;

    constructor(prefix: string, store: IStore, local: IPersistence, cloud?: IPersistence) {
        this.metadataKey = `${prefix}.metadata`;
        this.store = store;
        this.local = local;
        this.cloud = cloud;
        this.storeMetadata = MetadataManager.defaultMetadata;
    }

    getMetadata(persistence: IPersistence): Promise<Metadata> {
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
        const data = await this.store.loadData(this.metadataKey);
        this.storeMetadata = this.fromEntityKeyData(data);
        await this.computeMetadataHash(this.storeMetadata, this.store)
        return this.storeMetadata;
    }

    async getLocalMetadata(): Promise<Metadata> {
        const data = await this.local.loadData(this.metadataKey);
        return this.fromEntityKeyData(data);
    }

    async getCloudMetadata(): Promise<Metadata> {
        if (!this.cloud) throw new Error("Cloud persistence is configured");
        const data = await this.cloud.loadData(this.metadataKey);
        return this.fromEntityKeyData(data);
    }

    private async computeMetadataHash(metadata: Metadata, persistence: IPersistence): Promise<void> {
        const promises = Object.entries(metadata.entityKeys)
            .map(([entityKey, entityKeyData]) => this.computeEntityKeyHash(entityKey, entityKeyData, persistence));
        await Promise.all(promises);
    }

    private async computeEntityKeyHash(entityKey: string, entityKeyMetadata: EntityKeyMetadata, persistence: IPersistence): Promise<void> {
        let data = await persistence.loadData(entityKey);
        if (!data) return;
        data = sortKeys(data);
        await persistence.storeData(entityKey, data);
        entityKeyMetadata.hash = generateHash(JSON.stringify(data));
    }

    private fromEntityKeyData(data: EntityKeyData | null): Metadata {
        if (!data || !data.Metadata) return MetadataManager.defaultMetadata;
        return Object.values(data.Metadata)[0] as Metadata;
    }

    private which(persistence: IPersistence): "store" | "local" | "cloud" {
        if (persistence === this.store) return "store";
        if (persistence === this.local) return "local";
        if (this.cloud && persistence === this.cloud) return "cloud";
        throw new Error("Unknown persistence");
    }
}
import type { Tenant } from "@/modules/data-sync/entities/Tenant";
import type { IStore } from "@/modules/data-sync/interfaces/IStore";
import type { DeletedEntityIdRecord, EntityKeyData, EntityNameOf, EntityTypeOf } from "@/modules/data-sync/interfaces/types";
import type { util } from "../entities/entities";

type StoreData = {
    [key: string]: EntityKeyData
}

export class MemStore implements IStore<typeof util, Tenant> {
    private static instance: MemStore | null = null;
    public static getInstance(): MemStore {
        if (!MemStore.instance) {
            MemStore.instance = new MemStore();
        }
        return MemStore.instance;
    }

    private constructor() { }

    private store: StoreData = {};

    get<N extends EntityNameOf<typeof util>>(tenant: Tenant | null, entityKey: string, entityName: N, id: string): EntityTypeOf<typeof util, N> | null {
        const key = `${tenant?.id}/${entityKey}`;
        if (this.store[key]?.[entityName]?.[id]) {
            return this.store[key][entityName][id] as EntityTypeOf<typeof util, N>;
        }
        return null;
    }

    getAll<N extends EntityNameOf<typeof util>>(tenant: Tenant | null, entityKey: string, entityName: N): EntityTypeOf<typeof util, N>[] {
        const key = `${tenant?.id}/${entityKey}`;
        return Object.values(this.store[key]?.[entityName] || {}) as EntityTypeOf<typeof util, N>[];
    }

    save<N extends EntityNameOf<typeof util>>(tenant: Tenant | null, entityKey: string, entityName: N, data: EntityTypeOf<typeof util, N>): boolean {
        const key = `${tenant?.id}/${entityKey}`;
        if (!this.store[key]) this.store[key] = {};
        if (!this.store[key][entityName]) this.store[key][entityName] = {};
        (this.store[key][entityName] as Record<string, typeof data>)[data.id!] = data;
        return true;
    }

    delete<N extends EntityNameOf<typeof util>>(tenant: Tenant | null, entityKey: string, entityName: N, id: string): void {
        const key = `${tenant?.id}/${entityKey}`;
        if (this.store[key]?.[entityName]?.[id]) {
            delete this.store[key][entityName][id];
            this.store[key].deleted = this.store[key].deleted || {};

            const deletedEntityRecord: DeletedEntityIdRecord = this.store[key].deleted![entityName] || {};
            deletedEntityRecord[id] = new Date();
            this.store[key].deleted![entityName] = deletedEntityRecord;
        }
    }

    loadData(tenant: Tenant | null, key: string): Promise<EntityKeyData | null> {
        const entityKey = `${tenant?.id}/${key}`;
        return Promise.resolve(this.store[entityKey] || null);
    }

    storeData(tenant: Tenant | null, key: string, data: EntityKeyData): Promise<void> {
        const entityKey = `${tenant?.id}/${key}`;
        this.store[entityKey] = data;
        return Promise.resolve();
    }

    clearData(tenant: Tenant | null, key: string): Promise<void> {
        const entityKey = `${tenant?.id}/${key}`;
        delete this.store[entityKey];
        return Promise.resolve();
    }
}
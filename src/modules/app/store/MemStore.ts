import type { IStore } from "@/modules/data-sync/interfaces/IStore";
import type { DeletedEntityIdRecord, EntityKeyData, EntityNameOf, EntityTypeOf } from "@/modules/data-sync/interfaces/types";
import type { util } from "../entities/entities";

type StoreData = {
    [key: string]: EntityKeyData
}

export class MemStore implements IStore<typeof util> {
    private static instance: MemStore | null = null;
    public static getInstance(): MemStore {
        if (!MemStore.instance) {
            MemStore.instance = new MemStore();
        }
        return MemStore.instance;
    }

    private constructor() { }

    private store: StoreData = {};

    get<N extends EntityNameOf<typeof util>>(key: string, entityName: N, id: string): EntityTypeOf<typeof util, N> | null {
        if (this.store[key]?.[entityName]?.[id]) {
            return this.store[key][entityName][id] as EntityTypeOf<typeof util, N>;
        }
        return null;
    }

    getAll<N extends EntityNameOf<typeof util>>(key: string, entityName: N): EntityTypeOf<typeof util, N>[] {
        return Object.values(this.store[key]?.[entityName] || {}) as EntityTypeOf<typeof util, N>[];
    }

    save<N extends EntityNameOf<typeof util>>(key: string, entityName: N, data: EntityTypeOf<typeof util, N>): boolean {
        if (!this.store[key]) this.store[key] = {};
        if (!this.store[key][entityName]) this.store[key][entityName] = {};
        (this.store[key][entityName] as Record<string, typeof data>)[data.id!] = data;
        return true;
    }

    delete<N extends EntityNameOf<typeof util>>(key: string, entityName: N, id: string): void {
        if (this.store[key]?.[entityName]?.[id]) {
            delete this.store[key][entityName][id];
            this.store[key].deleted = this.store[key].deleted || {};

            const deletedEntityRecord: DeletedEntityIdRecord = this.store[key].deleted![entityName] || {};
            deletedEntityRecord[id] = new Date();
            this.store[key].deleted![entityName] = deletedEntityRecord;
        }
    }

    loadData(key: string): Promise<EntityKeyData | null> {
        return Promise.resolve(this.store[key] || null);
    }

    storeData(key: string, data: EntityKeyData): Promise<void> {
        this.store[key] = data;
        return Promise.resolve();
    }

    clearData(key: string): Promise<void> {
        delete this.store[key];
        return Promise.resolve();
    }
}
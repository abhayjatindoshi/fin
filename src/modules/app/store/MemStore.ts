import type { Entity, EntityName, EntityType } from "@/modules/store/interfaces/Entity";
import type { DeletedEntityRecord, EntityKeyData } from "@/modules/store/interfaces/EntityKeyData";
import type { IStore } from "@/modules/store/interfaces/IStore";

type StoreData = {
    [key: string]: EntityKeyData
}

export class MemStore implements IStore {

    private store: StoreData = {};

    get<N extends EntityName, T extends EntityType<N> & Entity>(key: string, entityName: EntityName, id: string): Promise<T | null> {
        if (this.store[key]?.[entityName]?.[id]) {
            return Promise.resolve(this.store[key][entityName][id] as T);
        }
        return Promise.resolve(null);
    }

    getAll<N extends EntityName, T extends EntityType<N> & Entity>(key: string, entityName: N): Promise<T[]> {
        return Promise.resolve(Object.values(this.store[key]?.[entityName] || {}) as T[]);
    }

    save<N extends EntityName, T extends EntityType<N> & Entity>(key: string, entityName: EntityName, data: T): Promise<boolean> {
        if (!this.store[key]) this.store[key] = {};
        if (!this.store[key][entityName]) this.store[key][entityName] = {};
        this.store[key][entityName][data.id!] = data;
        return Promise.resolve(true);
    }

    delete<N extends EntityName>(key: string, entityName: N, id: string): Promise<void> {
        if (this.store[key]?.[entityName]?.[id]) {
            delete this.store[key][entityName][id];
            this.store[key].deleted = this.store[key].deleted || {};

            const deletedEntityRecord: DeletedEntityRecord = this.store[key].deleted![entityName] || {};
            deletedEntityRecord[id] = new Date();
            this.store[key].deleted![entityName] = deletedEntityRecord;
        }
        return Promise.resolve();
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
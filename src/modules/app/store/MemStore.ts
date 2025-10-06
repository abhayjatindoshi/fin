import type { Entity } from "@/modules/data-sync/interfaces/Entity";
import type { IStore } from "@/modules/data-sync/interfaces/IStore";
import type { EntityKeyData } from "@/modules/data-sync/interfaces/types";
import type { util } from "../entities/entities";

type StoreData = {
    [key: string]: EntityKeyData
}

export class MemStore implements IStore<typeof util> {

    private store: StoreData = {};

    get<E extends Entity>(key: string, entityName: EntityName<E>, id: string): E | null {
        if (this.store[key]?.[entityName]?.[id]) {
            return this.store[key][entityName][id] as E;
        }
        return null;
    }

    getAll<E extends Entity>(key: string, entityName: EntityName<E>): E[] {
        return Object.values(this.store[key]?.[entityName] || {}) as E[];
    }

    save<E extends Entity>(key: string, entityName: EntityName<E>, data: E): boolean {
        if (!this.store[key]) this.store[key] = {};
        if (!this.store[key][entityName]) this.store[key][entityName] = {};
        this.store[key][entityName][data.id!] = data;
        return true;
    }

    delete<E extends Entity>(key: string, entityName: EntityName<E>, id: string): void {
        if (this.store[key]?.[entityName]?.[id]) {
            delete this.store[key][entityName][id];
            this.store[key].deleted = this.store[key].deleted || {};

            const deletedEntityRecord: DeletedEntityRecord = this.store[key].deleted![entityName] || {};
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
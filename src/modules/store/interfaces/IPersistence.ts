import type { EntityKeyData } from "./EntityKeyData";

export interface IPersistence {
    loadData(key: string): Promise<EntityKeyData | null>;
    storeData(key: string, data: EntityKeyData): Promise<void>;
    clearData(key: string): Promise<void>;
}
import type { EntityKey } from "./EntityKey";
import type { EntityKeyData } from "./EntityKeyData";

export interface IPersistence {
    loadData(key: EntityKey): Promise<EntityKeyData | null>;
    storeData(key: EntityKey, data: EntityKeyData): Promise<void>;
    clearData(key: EntityKey): Promise<void>;
}
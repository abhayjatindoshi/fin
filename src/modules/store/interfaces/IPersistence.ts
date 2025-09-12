import type { EntityKey } from "./Entity";
import type { EntityTypeRecordMap } from "./EntityKeyStore";

export interface IPersistence {
    loadData(key: EntityKey): Promise<EntityTypeRecordMap | null>;
    storeData(key: EntityKey, data: EntityTypeRecordMap): Promise<void>;
    clearData(key: EntityKey): Promise<void>;
}
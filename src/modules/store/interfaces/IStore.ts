import type { Entity, EntityName } from "./Entity";
import type { EntityKey } from "./EntityKey";
import type { IPersistence } from "./IPersistence";

export interface IStore extends IPersistence {
    get<T extends Entity>(key: EntityKey, entityName: EntityName, id: string): Promise<T | null>;
    getAll<T extends Entity>(key: EntityKey, entityName: EntityName): Promise<T[]>;
    save<T extends Entity>(key: EntityKey, entityName: EntityName, data: T): Promise<boolean>;
    delete(key: EntityKey, entityName: EntityName, id: string): Promise<void>;
}
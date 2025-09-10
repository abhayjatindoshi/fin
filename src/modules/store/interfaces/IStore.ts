import type { Entity, EntityKey, EntityName } from "./Entity";

export interface IStore {
    get<T extends Entity>(entityName: EntityName, key: EntityKey, id: string): Promise<T | null>;
    getAll<T extends Entity>(entityName: EntityName, key: EntityKey): Promise<T[]>;
    save<T extends Entity>(entityName: EntityName, key: EntityKey, data: T): Promise<boolean>;
    delete(entityName: EntityName, key: EntityKey, id: string): Promise<void>;
}
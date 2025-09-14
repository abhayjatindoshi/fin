import type { Entity, EntityName } from "./Entity";
import type { IPersistence } from "./IPersistence";

export interface IStore extends IPersistence {
    get<T extends Entity>(key: string, entityName: EntityName, id: string): Promise<T | null>;
    getAll<T extends Entity>(key: string, entityName: EntityName): Promise<T[]>;
    save<T extends Entity>(key: string, entityName: EntityName, data: T): Promise<boolean>;
    delete(key: string, entityName: EntityName, id: string): Promise<void>;
}
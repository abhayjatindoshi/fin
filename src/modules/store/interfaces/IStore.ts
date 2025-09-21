import type { Entity, EntityName, EntityType } from "./Entity";
import type { IPersistence } from "./IPersistence";

export interface IStore extends IPersistence {
    get<N extends EntityName, T extends EntityType<N> & Entity>(key: string, entityName: EntityName, id: string): Promise<T | null>;
    getAll<N extends EntityName, T extends EntityType<N> & Entity>(key: string, entityName: N): Promise<T[]>;
    save<N extends EntityName, T extends EntityType<N> & Entity>(key: string, entityName: EntityName, data: T): Promise<boolean>;
    delete<N extends EntityName>(key: string, entityName: N, id: string): Promise<void>;
}
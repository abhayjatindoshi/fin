import type { Entity } from "./Entity";
import type { IPersistence } from "./IPersistence";
import type { EntityName } from "./types";

export interface IStore extends IPersistence {
    get<E extends Entity>(key: string, entityName: EntityName<E>, id: string): E | null;
    getAll<E extends Entity>(key: string, entityName: EntityName<E>): E[];
    save<E extends Entity>(key: string, entityName: EntityName<E>, data: E): boolean;
    delete<E extends Entity>(key: string, entityName: EntityName<E>, id: string): void;
}
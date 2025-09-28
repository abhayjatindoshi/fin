import type { Entity } from "./Entity";
import type { EntityName } from "./types";

export interface IEntityKeyStrategy<FilterOptions> {
    separator: string;
    identifierLength: number;
    getKey<E extends Entity>(entityName: EntityName<E>, entity: E): string;
    entityKeyFilter<E extends Entity>(prefix: string, entityName: EntityName<E>, options?: FilterOptions): string[];
}
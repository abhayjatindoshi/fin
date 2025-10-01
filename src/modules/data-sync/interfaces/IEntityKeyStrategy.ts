import type { EntityUtil } from "../EntityUtil";
import type { EntityNameOf, EntityTypeOf, SchemaMap } from "./types";

export interface IEntityKeyStrategy<U extends EntityUtil<SchemaMap>, FilterOptions> {
    separator: string;
    identifierLength: number;
    generateKeyFor<N extends EntityNameOf<U>>(entityName: N, entity: EntityTypeOf<U, N>): string;
    generateAllKeysFor<N extends EntityNameOf<U>>(prefix: string, entityName: N, options?: FilterOptions): string[];
}
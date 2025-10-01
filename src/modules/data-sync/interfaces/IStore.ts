import type { EntityUtil } from "../EntityUtil";
import type { IPersistence } from "./IPersistence";
import type { EntityNameOf, EntityTypeOf, SchemaMap } from "./types";

export interface IStore<U extends EntityUtil<SchemaMap>> extends IPersistence {
    get<N extends EntityNameOf<U>>(key: string, entityName: N, id: string): EntityTypeOf<U, N> | null;
    getAll<N extends EntityNameOf<U>>(key: string, entityName: N): EntityTypeOf<U, N>[];
    save<N extends EntityNameOf<U>>(key: string, entityName: N, data: EntityTypeOf<U, N>): boolean;
    delete<N extends EntityNameOf<U>>(key: string, entityName: N, id: string): void;
}
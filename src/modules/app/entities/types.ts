import type { EntityUtil } from "@/modules/data-sync/EntityUtil";
import type { EntityNameOf, EntityTypeOf, SchemaMap } from "@/modules/data-sync/interfaces/types";

export type EntityScope = 'global' | 'yearly' | 'monthly';

// export type EntityConfigDefinition<E extends Entity> =
//     | { scope: 'global'; getKeyDate?: undefined }
//     | { scope: Exclude<EntityScope, 'global'>; getKeyDate: (entity: E) => Date };

export type EntityConfigDefinition<U extends EntityUtil<SchemaMap>, N extends EntityNameOf<U>> =
    | { scope: 'global'; getKeyDate?: undefined }
    | { scope: Exclude<EntityScope, 'global'>; getKeyDate: (entity: EntityTypeOf<U, N>) => Date };

export type EntityConfigMap<U extends EntityUtil<SchemaMap>> =
    { [N in EntityNameOf<U>]: EntityConfigDefinition<U, N> };
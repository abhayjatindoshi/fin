import type { Entity, EntityName, EntityType } from "./Entity";

export type EntityScope = 'global' | 'yearly' | 'monthly';

export type EntityConfig<T extends Entity> =
    | { scope: 'global'; getKeyDate?: undefined }
    | { scope: Exclude<EntityScope, 'global'>; getKeyDate: (entity: T) => Date };

export const EntityConfigs: { [K in EntityName]: EntityConfig<EntityType<K>> } = {
    UserAccount: { scope: 'global' },
    Metadata: { scope: 'global' },
}
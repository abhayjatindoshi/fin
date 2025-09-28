import type { Entity } from "@/modules/data-sync/interfaces/Entity";

export type EntityScope = 'global' | 'yearly' | 'monthly';

export type EntityConfig<E extends Entity> =
    | { scope: 'global'; getKeyDate?: undefined }
    | { scope: Exclude<EntityScope, 'global'>; getKeyDate: (entity: E) => Date };

export const EntityNames: Record<string, EntityConfig<Entity>> = {
    UserAccounts: { scope: 'global' }
} as const;
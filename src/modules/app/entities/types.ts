import type { Entity } from "@/modules/data-sync/interfaces/Entity";

export type EntityScope = 'global' | 'yearly' | 'monthly';

export type EntityConfigDefinition<E extends Entity> =
    | { scope: 'global'; getKeyDate?: undefined }
    | { scope: Exclude<EntityScope, 'global'>; getKeyDate: (entity: E) => Date };

// Helper function to create EntityName object from type keys
export const createEntityNames =
    <T extends Record<string, any>>(): { [K in keyof T]: K } =>
        new Proxy({} as { [K in keyof T]: K }, {
            get(_, prop) { return prop; }
        });

// EntityConfigs maps entity names to their configurations with proper typing
export type EntityConfigMap<T extends Record<string, Entity>> = { [K in keyof T]: EntityConfigDefinition<T[K]> };
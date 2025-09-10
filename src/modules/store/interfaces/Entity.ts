import type { UserAccount } from "../entities/UserAccount";

export interface Entity {
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export type StorageScope = 'global' | 'yearly' | 'monthly';

export interface EntityConfig<T extends Entity> {
    scope: StorageScope;
    getKeyDate: (entity: T) => Date;
}

function defineEntity<T extends Entity>(config: EntityConfig<T>) {
    return config;
}

export const E = {
    UserAccount: defineEntity({
        scope: 'global',
        getKeyDate: (entity: UserAccount) => entity.createdAt || new Date(),
    })
} as const;

export type EntityName = keyof typeof E;
export type EntityKey = string;

export interface QueryOptions {
    id?: string;
    where?: Partial<Entity>;
    limit?: number;
    offset?: number;
    sort?: { field: string; direction: 'asc' | 'desc' }[];
}
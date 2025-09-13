import type { Entity, EntityName } from './Entity';

export type EntityKeyData = {
    [entityName in EntityName]?: {
        [id: string]: Entity
    }
} & {
    deleted?: {
        [entityName in EntityName]?: {
            [id: string]: Date
        }
    }
};
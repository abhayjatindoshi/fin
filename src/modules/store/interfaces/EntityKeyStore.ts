import type { Entity, EntityKey, EntityName } from './Entity';

export type EntityTypeRecordMap = {
    [entityName in EntityName]: {
        [id: string]: Entity;
    };
};

export interface EntityKeyStore {
    [entityKey: EntityKey]: EntityTypeRecordMap;
}
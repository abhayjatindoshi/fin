import type { Entity } from '../interfaces/Entity';

export interface Metadata extends Entity {
    updatedAt: Date;
    entityKeys: {
        [entityKey: string]: EntityKeyMetadata
    }
}

export interface EntityKeyMetadata {
    updatedAt: Date;
    hash: number;
    entities: {
        [entityName: string]: {
            count: number;
            deletedCount: number;
        }
    }
}

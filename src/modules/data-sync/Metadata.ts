import type { Entity } from "./interfaces/Entity";

export interface Metadata extends Entity {
    updatedAt: Date;
    entityKeys: {
        [entityKey: string]: EntityKeyMetadata
    }
}

export interface EntityKeyMetadata {
    updatedAt: Date;
    hash: number;
    entities: Record<string, EntityMetadata>;
}

export interface EntityMetadata {
    count: number;
    deletedCount: number;
}

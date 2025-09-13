import type { Entity } from '../interfaces/Entity';

export interface Metadata extends Entity {
    updatedAt: Date;
    entityKeys: {
        [entityKey: string]: {
            updatedAt: Date;
            hash: number;
            entities: {
                [entityName: string]: {
                    count: number;
                    deletedCount: number;
                }
            }
        }
    }
}

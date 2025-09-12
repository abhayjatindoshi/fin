import type { Entity } from '../interfaces/Entity';

export interface Metadata extends Entity {
    entityKeyMeta: Record<string, {
        updatedAt: string;
        isDirty: boolean;
        entityCounts: Record<string, number>;
    }>;
}

import type { Entity } from "./Entity";

export interface QueryOptions {
    id?: string;
    where?: Partial<Entity>;
    years?: number[];
    limit?: number;
    offset?: number;
    sort?: { field: string; direction: 'asc' | 'desc' }[];
}
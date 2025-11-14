import type { EntityUtil } from "../EntityUtil";
import type { EntityNameOf, EntityTypeOf, SchemaMap } from "./types";

export interface QueryOptions<U extends EntityUtil<SchemaMap>, N extends EntityNameOf<U>> {
    ids?: string[];
    where?: Partial<EntityTypeOf<U, N>>;
    sort?: { field: string; direction: 'asc' | 'desc' }[];
}

export function filterEntities<U extends EntityUtil<SchemaMap>, N extends EntityNameOf<U>>(data: Array<EntityTypeOf<U, N>>, options?: QueryOptions<U, N>): Array<EntityTypeOf<U, N>> {
    if (!options) return data

    if (options.ids) data = data
        .filter(item => item.id && options.ids!.includes(item.id));

    if (options.where) data = data
        .filter(item => Object.entries(options.where!)
            .every(([key, value]) => item[key as keyof EntityTypeOf<U, N>] === value));

    return data.map(item => ({ ...item }));
}

export function sortEntities<U extends EntityUtil<SchemaMap>, N extends EntityNameOf<U>>(data: Array<EntityTypeOf<U, N>>, options?: QueryOptions<U, N>): Array<EntityTypeOf<U, N>> {
    if (!options || !options.sort) return data;

    options.sort.forEach(({ field, direction }) => {
        data = data.sort((a, b) => {
            const aVal = a[field as keyof EntityTypeOf<U, N>];
            const bVal = b[field as keyof EntityTypeOf<U, N>];
            if (aVal === bVal) return 0;
            if (aVal === undefined || aVal === null) return direction === 'asc' ? 1 : -1;
            if (bVal === undefined || bVal === null) return direction === 'asc' ? -1 : 1;
            if (aVal < bVal) return direction === 'asc' ? -1 : 1;
            return direction === 'asc' ? 1 : -1;
        });
    });
    return data;
}
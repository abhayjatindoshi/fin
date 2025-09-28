import type { Entity } from "./Entity";

export interface QueryOptions {
    ids?: string[];
    where?: Partial<Entity>;
    sort?: { field: string; direction: 'asc' | 'desc' }[];
}

export function filterEntities<T extends Entity>(data: Array<T>, options?: QueryOptions): Array<T> {
    if (!options) return data

    if (options.ids) data = data
        .filter(item => item.id && options.ids!.includes(item.id));

    if (options.where) data = data
        .filter(item => Object.entries(options.where!)
            .every(([key, value]) => item[key as keyof T] === value));

    if (options.sort) {
        options.sort.forEach(({ field, direction }) => {
            data = data.sort((a, b) => {
                const aVal = a[field as keyof T];
                const bVal = b[field as keyof T];
                if (aVal === bVal) return 0;
                if (aVal === undefined || aVal === null) return direction === 'asc' ? 1 : -1;
                if (bVal === undefined || bVal === null) return direction === 'asc' ? -1 : 1;
                if (aVal < bVal) return direction === 'asc' ? -1 : 1;
                return direction === 'asc' ? 1 : -1;
            });
        });
    }
    return data.map(item => ({ ...item }));
}
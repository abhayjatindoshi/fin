import type { Entity } from "./Entity";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type EntityName<_ extends Entity> = string;

export type EntityKeyData = EntityNameRecord<EntityRecord> &
{ deleted?: EntityNameRecord<DeletedEntityRecord> };

export type EntityRecord = Record<string, Entity>;
export type DeletedEntityRecord = Record<string, Date>;
export type EntityNameRecord<T> = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [entityName in EntityName<any>]?: T
}

export type EntityEventType = 'save' | 'delete';

export type EntityEvent = {
    type: EntityEventType;
    entityKey: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    entityName: EntityName<any>;
    id: string;
}

export type EntityKeyEvent = {
    type: Exclude<EntityEventType, 'delete'>;
    entityKey: string;
}
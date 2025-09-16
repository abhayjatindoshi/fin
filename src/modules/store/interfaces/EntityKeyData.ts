import type { Entity, EntityName } from './Entity';

export type EntityKeyData = EntityNameRecord<EntityRecord> &
{ deleted?: EntityNameRecord<DeletedEntityRecord> };

export type EntityRecord = Record<string, Entity>;
export type DeletedEntityRecord = Record<string, Date>;
export type EntityNameRecord<T> = {
    [entityName in EntityName]?: T
}
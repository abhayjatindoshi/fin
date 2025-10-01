import * as z from "zod";
import type { DataManager } from "../DataManager";
import type { EntityEventHandler } from "../EntityEventHandler";
import type { EntityKeyHandler } from "../EntityKeyHandler";
import type { EntityUtil } from "../EntityUtil";
import type { MetadataManager } from "../MetadataManager";
import type { ObservableManager } from "../ObservableManager";
import type { SyncScheduler } from "../SyncScheduler";
import type { Entity, EntitySchema } from "./Entity";
import type { IEntityKeyStrategy } from "./IEntityKeyStrategy";
import type { ILogger } from "./ILogger";
import type { IPersistence } from "./IPersistence";
import type { IStore } from "./IStore";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyZodObject = z.ZodObject<Record<string, any>>;
export type SchemaMap = Record<string, AnyZodObject>;

export type SchemasOf<U> = U extends EntityUtil<infer S> ? S : never;
export type EntityNameOf<U> = keyof SchemasOf<U> & string;
export type EntityTypeOf<U, N extends EntityNameOf<U>> = z.infer<SchemasOf<U>[N]> & z.infer<typeof EntitySchema>;

export type InputArgs<U extends EntityUtil<SchemaMap>, FilterOptions> = {
    util: U;
    prefix: string;
    store: IStore<U>;
    local: IPersistence;
    cloud?: IPersistence;
    strategy: IEntityKeyStrategy<U, FilterOptions>;
    logger?: ILogger;
}

export type Context<U extends EntityUtil<SchemaMap>, FilterOptions> = {

    util: U;
    prefix: string;
    strategy: IEntityKeyStrategy<U, FilterOptions>;

    store: IStore<U>;
    local: IPersistence;
    cloud?: IPersistence;

    logger: ILogger;

    dataManager: DataManager<U, FilterOptions>;
    observableManager: ObservableManager<U, FilterOptions>;

    entityKeyHandler: EntityKeyHandler<U, FilterOptions>;
    entityEventHandler: EntityEventHandler<U>;
    metadataManager: MetadataManager<U>;
    syncScheduler: SyncScheduler<U>;
}

export type EntityId = string;

export type EntityKey = string;

export type EntityNameRecord<T> = Record<string, T>

export type EntityIdRecord<T> = Record<EntityId, T>;

export type DeletedEntityIdRecord = Record<EntityId, Date>;

export type EntityKeyData =
    EntityNameRecord<EntityIdRecord<Entity>>
    & { deleted?: EntityNameRecord<DeletedEntityIdRecord> };

export type EntityEventType = 'save' | 'delete';

export type EntityEvent<U extends EntityUtil<SchemaMap>> = {
    type: EntityEventType,
    entityKey: EntityKey;
    entityName: EntityNameOf<U>;
    entityId: EntityId;
}

export type EntityKeyEvent = {
    type: Exclude<EntityEventType, 'delete'>;
    entityKey: EntityKey;
}
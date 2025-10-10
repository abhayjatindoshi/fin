import * as z from "zod";
import type { DataManager } from "../DataManager";
import type { DirtyTracker } from "../DirtyTracker";
import type { EntityEventHandler } from "../EntityEventHandler";
import type { EntityKeyHandler } from "../EntityKeyHandler";
import type { EntityUtil } from "../EntityUtil";
import type { MetadataManager } from "../MetadataManager";
import type { ObservableManager } from "../ObservableManager";
import type { SyncScheduler } from "../SyncScheduler";
import type { Entity, EntitySchema } from "../entities/Entity";
import type { Tenant } from "../entities/Tenant";
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

export type InputArgs<U extends EntityUtil<SchemaMap>, FilterOptions, T extends Tenant> = {
    util: U;
    tenant: T;
    store: IStore<U, T>;
    local: IPersistence<T>;
    cloud?: IPersistence<T>;
    strategy: IEntityKeyStrategy<U, FilterOptions>;
    logger?: ILogger;
}

export type Context<U extends EntityUtil<SchemaMap>, FilterOptions, T extends Tenant> = {

    util: U;
    tenant: T;
    strategy: IEntityKeyStrategy<U, FilterOptions>;

    store: IStore<U, T>;
    local: IPersistence<T>;
    cloud?: IPersistence<T>;

    logger: ILogger;

    dataManager: DataManager<U, FilterOptions, T>;
    observableManager: ObservableManager<U, FilterOptions, T>;

    entityKeyHandler: EntityKeyHandler<U, FilterOptions>;
    entityEventHandler: EntityEventHandler<U>;
    dirtyTracker: DirtyTracker<T>;
    metadataManager: MetadataManager<U, T>;
    syncScheduler: SyncScheduler<U, T>;
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

type ExtendsShape<ShapeType extends z.ZodRawShape> = z.ZodObject<z.ZodRawShape & ShapeType>;
export type ExtendsEntity = ExtendsShape<typeof EntitySchema.shape>;
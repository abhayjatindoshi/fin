import type { Metadata } from "../store/entities/Metadata";
import { EntityKey } from "../store/interfaces/EntityKey";
import type { IPersistence } from "../store/interfaces/IPersistence";
import type { Entity, EntityName } from "./interfaces/Entity";
import type { EntityKeyData } from "./interfaces/EntityKeyData";
import { Utils } from "./utils";

export async function loadMetadata(prefix: string, p: IPersistence): Promise<Metadata | null> {
    const key = EntityKey.from(`${prefix}.metadata`);
    const data = await p.loadData(key);
    if (!data || !data.Metadata) {
        // Setup default metadata if not present
        const defaultMeta: Metadata = {
            updatedAt: new Date(0),
            entityKeys: {}
        };
        await p.storeData(key, { Metadata: { id: defaultMeta } });
        return defaultMeta;
    }
    return Object.values(data.Metadata)[0] as Metadata;
}

export async function saveMetadata(prefix: string, p: IPersistence, metadata: Metadata): Promise<void> {
    const key = EntityKey.from(`${prefix}.metadata`);
    const data: EntityKeyData = {
        Metadata: {
            'id': metadata
        }
    }
    await p.storeData(key, data);
}

export function sortEntityKeyData(data: EntityKeyData) {
    for (const entityName in data) {
        if (entityName === 'deleted') {
            for (const delEntityName in data.deleted) {
                data.deleted[delEntityName as EntityName] = sortKeys(data.deleted[delEntityName as EntityName]!);
            }
        } else {
            data[entityName as EntityName] = sortKeys(data[entityName as EntityName]!);
        }
    }
}

export function sortKeys<T>(obj: Record<string, T>): Record<string, T> {
    return Object.keys(obj)
        .sort()
        .reduce((acc, key) => {
            acc[key] = obj[key];
            return acc;
        }, {} as Record<string, T>);
}

export async function sync(prefix: string, a: IPersistence, b: IPersistence): Promise<void> {
    // Step 1: Compare metadata.updatedAt of a and b
    const metaA = await loadMetadata(prefix, a);
    const metaB = await loadMetadata(prefix, b);
    if (!metaA || !metaB) return;
    if (metaA.updatedAt.getTime() === metaB.updatedAt.getTime()) {
        // No changes, exit
        return;
    }
    // TODO: used in A consistency check
    const updateTimeA = metaA.updatedAt;

    // Step 2: Identify missing and mismatched entity keys using map/filter
    const keysA = Object.keys(metaA.entityKeys);
    const keysB = Object.keys(metaB.entityKeys);

    // Keys present in A but missing in B
    const missingInB = keysA.filter(key => !keysB.includes(key));

    // Keys present in B but missing in A
    // TODO: used in A consistency check
    const missingInA = keysB.filter(key => !keysA.includes(key));

    // Keys present in both but with hash mismatch
    const mismatchedKeys = keysA.filter(key => keysB.includes(key) && metaA.entityKeys[key].hash !== metaB.entityKeys[key].hash);

    // Step 2a: Keys present in A but missing in B (copy from A to B)
    for (const entityKeyStr of missingInB) {
        const entityKey = EntityKey.from(entityKeyStr);
        const dataA = await a.loadData(entityKey);
        if (!dataA) continue;
        await b.storeData(entityKey, dataA);
        metaB.entityKeys[entityKeyStr] = {
            ...metaA.entityKeys[entityKeyStr]
        };
    }

    // TODO: Step 2b:  - Handle keys present in B but missing in A (copy from B to A) if needed.

    // Collect deferred changes for A
    const bucketA: { entityKey: EntityKey, entityName: string, entityId: string, entity: Entity | Date }[] = [];

    // Step 3: Keys present in both but with hash mismatch (resolve)
    for (const entityKeyStr of mismatchedKeys) {
        const entityKey = EntityKey.from(entityKeyStr);
        const dataA = await a.loadData(entityKey);
        const dataB = await b.loadData(entityKey);
        if (!dataA || !dataB) continue;

        const dataAEntityNames = Object.keys(dataA);
        const dataBEntityNames = Object.keys(dataB);
        const entityNames = new Set<string>([...dataAEntityNames, ...dataBEntityNames]);
        for (const entityNameStr of entityNames) {
            if (entityNameStr === 'deleted') continue;
            const entityName = entityNameStr as EntityName;
            const entitiesA = dataA[entityName as EntityName];
            const entitiesB = dataB[entityName as EntityName];

            // if entityName exists does not exist in A, copy entire entity from B to A for deferred processing
            if (!entitiesA && entitiesB) {
                bucketA.push(...Object.values(entitiesB).map(entity => ({ entityKey, entityName, entityId: entity.id!, entity })));
            }

            // if entityName does not exist in B, copy entire entity from A to B immediately
            if (!entitiesB && entitiesA) {
                dataB[entityName as EntityName] = entitiesA;
                metaB.entityKeys[entityKeyStr].entities[entityName] = metaA.entityKeys[entityKeyStr].entities[entityName];
            }

            const deletedA = (dataA.deleted && dataA.deleted[entityName]) ? dataA.deleted[entityName] : {};
            const deletedB = (dataB.deleted && dataB.deleted[entityName]) ? dataB.deleted[entityName] : {};
            const allIds = new Set<string>([...Object.keys(entitiesA || {}), ...Object.keys(entitiesB || {}), ...Object.keys(deletedA), ...Object.keys(deletedB)]);
            for (const id of allIds) {
                const entityA = entitiesA ? entitiesA[id] : undefined;
                const entityB = entitiesB ? entitiesB[id] : undefined;
                const deletionTimeA = deletedA[id];
                const deletionTimeB = deletedB[id];

                // Case 1: Both entities exist in A and B
                if (entityA && entityB) {
                    // Prefer entity with higher version, or if versions equal, newer updatedAt
                    if (entityA.version! > entityB.version! ||
                        (entityA.version! == entityB.version! && entityA.updatedAt! > entityB.updatedAt!)) {
                        if (!dataB[entityName]) dataB[entityName] = {};
                        dataB[entityName][id] = entityA;
                    } else if (entityA.version! < entityB.version! ||
                        (entityA.version! == entityB.version! && entityA.updatedAt! < entityB.updatedAt!)) {
                        bucketA.push({ entityKey, entityName, entityId: entityB.id!, entity: entityB });
                    }
                    // If both version and updatedAt are equal, do nothing
                }
                // Case 2: Entity exists in A, but is deleted in B
                else if (entityA && deletionTimeB) {
                    if (entityA.updatedAt! > deletionTimeB) {
                        if (!dataB[entityName]) dataB[entityName] = {};
                        dataB[entityName][id] = entityA;
                        if (dataB.deleted && dataB.deleted[entityName]) {
                            delete dataB.deleted[entityName][id];
                        }
                    } else if (entityA.updatedAt! <= deletionTimeB) {
                        bucketA.push({ entityKey, entityName, entityId: entityA.id!, entity: deletionTimeB });
                    }
                }
                // Case 3: Entity is deleted in A, but exists in B
                else if (deletionTimeA && entityB) {
                    if (deletionTimeA > entityB.updatedAt!) {
                        if (!dataB[entityName]) dataB[entityName] = {};
                        delete dataB[entityName][id];
                        if (!dataB.deleted) dataB.deleted = {};
                        if (!dataB.deleted[entityName]) dataB.deleted[entityName] = {};
                        dataB.deleted[entityName][id] = deletionTimeA;
                    } else if (deletionTimeA <= entityB.updatedAt!) {
                        bucketA.push({ entityKey, entityName, entityId: entityB.id!, entity: entityB });
                    }
                }
                // Case 4: Entity exists only in A
                else if (entityA) {
                    if (!dataB[entityName]) dataB[entityName] = {};
                    dataB[entityName][id] = entityA;
                }
                // Case 5: Entity exists only in B
                else if (entityB) {
                    bucketA.push({ entityKey, entityName, entityId: entityB.id!, entity: entityB });
                }
            }
        }

        // Step 4: After processing all entityNames and ids for this entityKey, store updated dataB

        sortEntityKeyData(dataB);
        await b.storeData(entityKey, dataB);
        metaB.entityKeys[entityKeyStr] = {
            updatedAt: new Date(),
            hash: Utils.generateHash(JSON.stringify(dataB)),
            entities: dataB ? Object.fromEntries(Object.keys(dataB).filter(k => k !== 'deleted').map(k => [k, { count: Object.keys(dataB[k as EntityName] || {}).length, deletedCount: Object.keys((dataB.deleted && dataB.deleted[k as EntityName]) ? dataB.deleted[k as EntityName]! : {}).length }])) : {}
        };
    }

    await saveMetadata(prefix, b, metaB);

    const updatedMetaA = await loadMetadata(prefix, a);
    if (!updatedMetaA) return;

    // Step 5: Now apply all deferred changes to A
    if (updatedMetaA.updatedAt.getTime() === updateTimeA.getTime()) {
        // Apply deferred changes
        // missingInA handling
        for (const entityKeyStr of missingInA) {
            const entityKey = EntityKey.from(entityKeyStr);
            const dataB = await b.loadData(entityKey);
            if (!dataB) continue;
            await a.storeData(entityKey, dataB);
            updatedMetaA.entityKeys[entityKeyStr] = {
                ...metaB.entityKeys[entityKeyStr]
            };
        }

        // group bucketA by entityKey and entityName for efficient processing
        const bucketMap: { [entityKeyStr: string]: { [entityName: string]: { [entityId: string]: Entity | Date } } } = {};
        for (const item of bucketA) {
            const entityKeyStr = item.entityKey.toString();
            if (!bucketMap[entityKeyStr]) {
                bucketMap[entityKeyStr] = {};
            }
            if (!bucketMap[entityKeyStr][item.entityName]) {
                bucketMap[entityKeyStr][item.entityName] = {};
            }
            bucketMap[entityKeyStr][item.entityName][item.entityId] = item.entity;
        }

        for (const entityKeyStr of Object.keys(bucketMap)) {
            const entityKey = EntityKey.from(entityKeyStr);
            const dataA = await a.loadData(entityKey);
            if (!dataA) continue;
            if (!dataA.deleted) dataA.deleted = {};
            const entityNameMap = bucketMap[entityKeyStr];
            for (const entityNameStr of Object.keys(entityNameMap)) {
                const entityName = entityNameStr as EntityName;
                const entities = entityNameMap[entityNameStr];
                for (const entityId of Object.keys(entities)) {
                    const entity = entities[entityId];
                    if (entity instanceof Date) {
                        // Deletion
                        if (!dataA.deleted[entityName]) dataA.deleted[entityName] = {};
                        dataA.deleted[entityName][entityId] = entity;
                        if (dataA[entityName] && dataA[entityName][entityId]) {
                            delete dataA[entityName][entityId];
                        }
                    } else {
                        // Addition/Update
                        if (!dataA[entityName]) dataA[entityName] = {};
                        dataA[entityName][entityId] = entity;
                        if (dataA.deleted[entityName] && dataA.deleted[entityName][entityId]) {
                            delete dataA.deleted[entityName][entityId];
                        }
                    }
                }
            }
            // After processing all entityNames and ids for this entityKey, store updated dataA
            sortEntityKeyData(dataA);
            await a.storeData(entityKey, dataA);
            updatedMetaA.entityKeys[entityKeyStr] = {
                updatedAt: new Date(),
                hash: Utils.generateHash(JSON.stringify(dataA)),
                entities: dataA ? Object.fromEntries(Object.keys(dataA).filter(k => k !== 'deleted').map(k => [k, { count: Object.keys(dataA[k as EntityName] || {}).length, deletedCount: Object.keys((dataA.deleted && dataA.deleted[k as EntityName]) ? dataA.deleted[k as EntityName]! : {}).length }])) : {}
            };
            await saveMetadata(prefix, a, updatedMetaA);
        }
    } else {

        // A was modified during sync
        // Compare missingInA and bucketA changes and apply based on latest update wins

        // Handle missingInA
        for (const entityKeyStr of missingInA) {
            const entityKey = EntityKey.from(entityKeyStr);
            const dataB = await b.loadData(entityKey);
            const dataA = await a.loadData(entityKey);
            if (!dataB) continue;
            if (!dataA) {
                // If dataA does not exist, copy from B
                await a.storeData(entityKey, dataB);
                updatedMetaA.entityKeys[entityKeyStr] = {
                    ...metaB.entityKeys[entityKeyStr]
                };
            } else {
                // Compare all entities and apply only newer entities from B to A
                if (!dataA.deleted) dataA.deleted = {};
                for (const entityNameStr of Object.keys(dataB)) {
                    if (entityNameStr === 'deleted') continue;
                    const entityName = entityNameStr as EntityName;
                    const entitiesB = dataB[entityName] || {};
                    const entitiesA = dataA[entityName] || {};
                    for (const entityId of Object.keys(entitiesB)) {
                        const entityB = entitiesB[entityId];
                        const entityA = entitiesA[entityId];
                        if (
                            !entityA ||
                            entityB.version! > entityA.version! ||
                            (entityB.version! === entityA.version! && entityB.updatedAt! > entityA.updatedAt!)
                        ) {
                            if (!dataA[entityName]) dataA[entityName] = {};
                            dataA[entityName][entityId] = entityB;
                            if (dataA.deleted[entityName] && dataA.deleted[entityName][entityId]) {
                                delete dataA.deleted[entityName][entityId];
                            }
                        }
                    }
                }
                // Handle deletions from B
                const deletedB = dataB.deleted || {};
                for (const entityNameStr of Object.keys(deletedB)) {
                    const entityName = entityNameStr as EntityName;
                    const deletedEntitiesB = deletedB[entityName] || {};
                    for (const entityId of Object.keys(deletedEntitiesB)) {
                        const deletionTimeB = deletedEntitiesB[entityId];
                        const currentDeletedA = dataA.deleted[entityName]?.[entityId];
                        const entityA = dataA[entityName]?.[entityId];
                        if (!currentDeletedA || deletionTimeB > currentDeletedA) {
                            if (!dataA.deleted[entityName]) dataA.deleted[entityName] = {};
                            dataA.deleted[entityName][entityId] = deletionTimeB;
                            if (entityA) {
                                if (dataA[entityName]) {
                                    delete dataA[entityName][entityId];
                                }
                            }
                        }
                    }
                }
                sortEntityKeyData(dataA);
                await a.storeData(entityKey, dataA);
                updatedMetaA.entityKeys[entityKeyStr] = {
                    updatedAt: new Date(),
                    hash: Utils.generateHash(JSON.stringify(dataA)),
                    entities: dataA ? Object.fromEntries(Object.keys(dataA).filter(k => k !== 'deleted').map(k => [k, { count: Object.keys(dataA[k as EntityName] || {}).length, deletedCount: Object.keys((dataA.deleted && dataA.deleted[k as EntityName]) ? dataA.deleted[k as EntityName]! : {}).length }])) : {}
                };
            }
        }

        // Handle bucketA changes
        const bucketMap: { [entityKeyStr: string]: { [entityName: string]: { [entityId: string]: Entity | Date } } } = {};
        for (const item of bucketA) {
            const entityKeyStr = item.entityKey.toString();
            if (!bucketMap[entityKeyStr]) bucketMap[entityKeyStr] = {};
            if (!bucketMap[entityKeyStr][item.entityName]) bucketMap[entityKeyStr][item.entityName] = {};
            bucketMap[entityKeyStr][item.entityName][item.entityId] = item.entity;
        }

        for (const entityKeyStr of Object.keys(bucketMap)) {
            const entityKey = EntityKey.from(entityKeyStr);
            const dataA = await a.loadData(entityKey);
            if (!dataA) continue;
            if (!dataA.deleted) dataA.deleted = {};
            const entityNameMap = bucketMap[entityKeyStr];
            for (const entityNameStr of Object.keys(entityNameMap)) {
                const entityName = entityNameStr as EntityName;
                const entities = entityNameMap[entityNameStr];
                for (const entityId of Object.keys(entities)) {
                    const entity = entities[entityId];
                    if (entity instanceof Date) {
                        // Deletion: apply only if deletion time is newer
                        const currentDeleted = dataA.deleted[entityName]?.[entityId];
                        if (!currentDeleted || entity > currentDeleted) {
                            if (!dataA.deleted[entityName]) dataA.deleted[entityName] = {};
                            dataA.deleted[entityName][entityId] = entity;
                            if (dataA[entityName] && dataA[entityName][entityId]) {
                                delete dataA[entityName][entityId];
                            }
                        }
                    } else {
                        // Addition/Update: apply only if entity is newer
                        const currentEntity = dataA[entityName]?.[entityId];
                        if (
                            !currentEntity ||
                            entity.version! > currentEntity.version! ||
                            (entity.version! === currentEntity.version! && entity.updatedAt! > currentEntity.updatedAt!)
                        ) {
                            if (!dataA[entityName]) dataA[entityName] = {};
                            dataA[entityName][entityId] = entity;
                            if (dataA.deleted[entityName] && dataA.deleted[entityName][entityId]) {
                                delete dataA.deleted[entityName][entityId];
                            }
                        }
                    }
                }
            }
            // After processing all entityNames and ids for this entityKey, store updated dataA
            sortEntityKeyData(dataA);
            await a.storeData(entityKey, dataA);
            updatedMetaA.entityKeys[entityKeyStr] = {
                updatedAt: new Date(),
                hash: Utils.generateHash(JSON.stringify(dataA)),
                entities: dataA ? Object.fromEntries(Object.keys(dataA).filter(k => k !== 'deleted').map(k => [k, { count: Object.keys(dataA[k as EntityName] || {}).length, deletedCount: Object.keys((dataA.deleted && dataA.deleted[k as EntityName]) ? dataA.deleted[k as EntityName]! : {}).length }])) : {}
            };
        }

        await saveMetadata(prefix, a, updatedMetaA);
    }

    // Step 7: Two-way consistency check and finalize (stub)
    // Reload metaA, check if modifiedAt == t1, apply bucket if needed
}

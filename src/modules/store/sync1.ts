// sync.ts (refactored)
// Focused, modular, removes duplicated code paths and centralizes entity-resolution logic.

import type { Metadata } from "./entities/Metadata";
import type { Entity, EntityName } from "./interfaces/Entity";
import type { EntityKey } from "./interfaces/EntityKey";
import type { EntityKeyData } from "./interfaces/EntityKeyData";
import type { IPersistence } from "./interfaces/IPersistence";
import { Utils } from "./utils";



/**
 * Helpers & Types
 */

// type DeletedMap = { [entityName: string]: { [id: string]: string } };

type BucketEntry = {
    entityKey: EntityKey;
    entityName: EntityName;
    entityId: string;
    entity: Entity | string; // if string => deletionTime (ISO)
};

/** Convert string | Date | undefined into millis (number). Undefined -> -Infinity for comparisons. */
function toMillis(t?: string | Date): number {
    if (!t) return Number.NEGATIVE_INFINITY;
    if (t instanceof Date) return t.getTime();
    const parsed = Date.parse(t);
    return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
}

/** Stable sort keys for an object */
export function sortKeys<T>(obj: Record<string, T>): Record<string, T> {
    return Object.keys(obj)
        .sort()
        .reduce((acc, key) => {
            acc[key] = obj[key];
            return acc;
        }, {} as Record<string, T>);
}

/** Ensure entityKeyData is deterministically ordered (for stable hashing) */
export function sortEntityKeyData(data: EntityKeyData) {
    for (const entityName in data) {
        if (entityName === "deleted") {
            for (const delEntityName in data.deleted) {
                data.deleted[delEntityName as EntityName] = sortKeys(
                    data.deleted[delEntityName as EntityName]!
                );
            }
            // sort deleted object itself
            data.deleted = sortKeys(data.deleted);
        } else {
            data[entityName as EntityName] = sortKeys(
                data[entityName as EntityName] || {}
            );
        }
    }
}

/**
 * Metadata helpers
 */
export async function loadMetadata(
    prefix: string,
    p: IPersistence
): Promise<Metadata | null> {
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

export async function saveMetadata(
    prefix: string,
    p: IPersistence,
    metadata: Metadata
): Promise<void> {
    const key = EntityKey.from(`${prefix}.metadata`);
    const data: EntityKeyData = {
        Metadata: {
            id: metadata
        }
    };
    await p.storeData(key, data);
}

/** Compute entities stats for metadata.entities (count/deletedCount) */
function computeEntityStats(data: EntityKeyData) {
    const result: { [entityName: string]: { count: number; deletedCount: number } } = {};
    for (const key of Object.keys(data)) {
        if (key === "deleted") continue;
        const map = data[key as EntityName] || {};
        const count = Object.keys(map).length;
        const deletedCount = Object.keys((data.deleted && data.deleted[key as EntityName]) || {}).length;
        result[key] = { count, deletedCount };
    }
    return result;
}

/** Update metadata entry for a given entityKey using the provided entityKeyData */
function updateEntityKeyMeta(
    meta: Metadata,
    entityKeyStr: string,
    data: EntityKeyData
) {
    sortEntityKeyData(data);
    const hash = Utils.generateHash(JSON.stringify(data));
    meta.entityKeys[entityKeyStr] = {
        updatedAt: new Date(),
        hash,
        entities: computeEntityStats(data)
    };
}

/**
 * High-level copy: copy entire entityKey file from source -> target and update target metadata
 */
async function copyEntityKeyFile(
    prefix: string,
    source: IPersistence,
    target: IPersistence,
    entityKey: EntityKey,
    targetMeta: Metadata,
    sourceMeta: Metadata
) {
    const entityKeyStr = entityKey.toString();
    const data = await source.loadData(entityKey);
    if (!data) return;
    await target.storeData(entityKey, data);
    // copy metadata entry
    targetMeta.entityKeys[entityKeyStr] = { ...sourceMeta.entityKeys[entityKeyStr] };
    // ensure deterministic ordering
    updateEntityKeyMeta(targetMeta, entityKeyStr, data);
}

/**
 * Entity-level conflict resolver (pure).
 *
 * Inputs:
 *  - entityA / entityB: active entities (or undefined)
 *  - deletedA/deletedB: deletion time strings (or undefined)
 *
 * Returns object with action:
 *  - "keepA" -> A wins (should be written into B)
 *  - "keepB" -> B wins (should be written into A)
 *  - "deleteWithTime" -> instruct delete with provided time
 *  - "noop" -> nothing to do
 */
function resolveEntityConflict(
    entityA?: Entity,
    deletedA?: string,
    entityB?: Entity,
    deletedB?: string
):
    | { action: "keepA"; entity: Entity }
    | { action: "keepB"; entity: Entity }
    | { action: "deleteWithTime"; deletionTime: string }
    | { action: "noop" } {
    // Case both active
    if (entityA && entityB) {
        const aVer = entityA.version ?? 0;
        const bVer = entityB.version ?? 0;
        if (aVer > bVer) return { action: "keepA", entity: entityA };
        if (bVer > aVer) return { action: "keepB", entity: entityB };
        // versions equal - compare updatedAt
        const aTime = toMillis(entityA.updatedAt);
        const bTime = toMillis(entityB.updatedAt);
        if (aTime > bTime) return { action: "keepA", entity: entityA };
        if (bTime > aTime) return { action: "keepB", entity: entityB };
        return { action: "noop" };
    }

    // Active vs Deleted
    if (entityA && deletedB) {
        // if deletion on B happened after entityA.updatedAt => delete wins
        const deletionBTime = toMillis(deletedB);
        const entityATime = toMillis(entityA.updatedAt);
        if (deletionBTime > entityATime) {
            return { action: "deleteWithTime", deletionTime: deletedB };
        } else {
            return { action: "keepA", entity: entityA };
        }
    }

    if (entityB && deletedA) {
        const deletionATime = toMillis(deletedA);
        const entityBTime = toMillis(entityB.updatedAt);
        if (deletionATime > entityBTime) {
            return { action: "deleteWithTime", deletionTime: deletedA };
        } else {
            return { action: "keepB", entity: entityB };
        }
    }

    // One side present only (no deletion)
    if (entityA && !entityB && !deletedB) return { action: "keepA", entity: entityA };
    if (entityB && !entityA && !deletedA) return { action: "keepB", entity: entityB };

    // Both deleted or missing both -> noop
    return { action: "noop" };
}

/**
 * Reconcile a single entityKey between A and B.
 *
 * - dataA and dataB are the in-memory representations of the entityKey file for A and B.
 * - bucket collects entries that should be applied back to A (deferred) because B had fresher data.
 *
 * This function mutates dataA and dataB in-place (per original flow), and pushes bucket entries.
 */
async function reconcileEntityKey(
    entityKey: EntityKey,
    dataA: EntityKeyData,
    dataB: EntityKeyData,
    bucket: BucketEntry[]
) {
    // gather entityNames (including deleted map keys)
    const names = new Set<string>([
        ...Object.keys(dataA || {}),
        ...Object.keys(dataB || {})
    ]);
    // iterate entityName by entityName
    for (const entityNameStr of names) {
        if (entityNameStr === "deleted") continue;
        const entityName = entityNameStr as EntityName;
        const entitiesA = dataA[entityName] || {};
        const entitiesB = dataB[entityName] || {};
        const deletedA = (dataA.deleted && dataA.deleted[entityName]) ? dataA.deleted[entityName] : {};
        const deletedB = (dataB.deleted && dataB.deleted[entityName]) ? dataB.deleted[entityName] : {};

        // union of IDs from active and deleted
        const allIds = new Set<string>([
            ...Object.keys(entitiesA || {}),
            ...Object.keys(entitiesB || {}),
            ...Object.keys(deletedA || {}),
            ...Object.keys(deletedB || {})
        ]);

        for (const id of allIds) {
            const entityA = entitiesA[id];
            const entityB = entitiesB[id];
            const deletionA = deletedA[id];
            const deletionB = deletedB[id];

            const res = resolveEntityConflict(entityA, deletionA, entityB, deletionB);

            switch (res.action) {
                case "keepA":
                    // ensure B has entityA (and remove any deletion marker in B)
                    if (!dataB[entityName]) dataB[entityName] = {};
                    dataB[entityName][id] = res.entity;
                    if (dataB.deleted && dataB.deleted[entityName] && dataB.deleted[entityName][id]) {
                        delete dataB.deleted[entityName][id];
                    }
                    break;

                case "keepB":
                    // B is fresher -> add to bucket to later apply to A
                    bucket.push({
                        entityKey,
                        entityName,
                        entityId: id,
                        entity: res.entity
                    });
                    break;

                case "deleteWithTime":
                    // deletion time comes from whichever side had the deletion (res.deletionTime)
                    // If deletion should be present in B (because deleteTime was chosen due to conflict), ensure B has delete
                    if (!dataB.deleted) dataB.deleted = {};
                    if (!dataB.deleted[entityName]) dataB.deleted[entityName] = {};
                    dataB.deleted[entityName][id] = res.deletionTime;
                    if (dataB[entityName] && dataB[entityName][id]) {
                        delete dataB[entityName][id];
                    }

                    // also ensure bucket knows about deletion so A can be updated if needed
                    bucket.push({
                        entityKey,
                        entityName,
                        entityId: id,
                        entity: res.deletionTime
                    });
                    break;

                case "noop":
                    // nothing to do
                    break;
            }
        }
    }
}

/**
 * Apply a bucket of deferred changes into persistence `target`.
 * The bucket entries may be entity objects (to upsert) or deletion time strings (to delete).
 *
 * This function groups by entityKey for efficiency, mutates files and updates metadata accordingly.
 */
async function applyBucket(
    prefix: string,
    target: IPersistence,
    bucket: BucketEntry[],
    targetMeta: Metadata
) {
    if (!bucket.length) return;

    // Group bucket entries by entityKey
    const grouped: { [entityKeyStr: string]: BucketEntry[] } = {};
    for (const item of bucket) {
        const keyStr = item.entityKey.toString();
        grouped[keyStr] = grouped[keyStr] || [];
        grouped[keyStr].push(item);
    }

    for (const entityKeyStr of Object.keys(grouped)) {
        const entityKey = EntityKey.from(entityKeyStr);
        const data = await target.loadData(entityKey);
        if (!data) continue;
        if (!data.deleted) data.deleted = {};

        for (const item of grouped[entityKeyStr]) {
            const entityName = item.entityName;
            const id = item.entityId;
            const payload = item.entity;

            if (typeof payload === "string") {
                // treat as deletion time
                if (!data.deleted) data.deleted = {};
                if (!data.deleted[entityName]) data.deleted[entityName] = {};
                // only apply deletion if it's newer
                const currentDel = data.deleted[entityName][id];
                if (!currentDel || toMillis(payload) > toMillis(currentDel)) {
                    data.deleted[entityName][id] = payload;
                }
                // remove active entity if present and older than deletion
                if (data[entityName] && data[entityName][id]) {
                    const curEnt = data[entityName][id];
                    if (toMillis(payload) >= toMillis(curEnt.updatedAt)) {
                        delete data[entityName][id];
                    }
                }
            } else {
                // payload is Entity -> add/update if newer than existing entity or deletion
                if (!data[entityName]) data[entityName] = {};
                const existing = data[entityName][id];
                const deletedTime = data.deleted![entityName] && data.deleted![entityName][id];
                const shouldApply =
                    !existing ||
                    (payload.version ?? 0) > (existing.version ?? 0) ||
                    ((payload.version ?? 0) === (existing.version ?? 0) && toMillis(payload.updatedAt) > toMillis(existing.updatedAt));

                // apply only if no newer deletion exists
                if (!deletedTime || toMillis(payload.updatedAt) > toMillis(deletedTime)) {
                    if (shouldApply) {
                        data[entityName][id] = payload;
                        // remove any deletion marker
                        if (data.deleted && data.deleted[entityName] && data.deleted[entityName][id]) {
                            delete data.deleted[entityName][id];
                        }
                    }
                }
            }
        }

        // finalize: sort & store & update metadata
        sortEntityKeyData(data);
        await target.storeData(entityKey, data);
        updateEntityKeyMeta(targetMeta, entityKeyStr, data);
        // persist metadata for target after each file to keep metadata consistent (optional but safer)
        await saveMetadata(prefix, target, targetMeta);
    }
}

/**
 * Top-level sync orchestration (refactored).
 *
 * Maintains original semantics:
 *  - Compare metadata.updatedAt
 *  - Copy missing keys
 *  - Reconcile mismatched keys (A vs B), writing fresher results into B and collecting a bucket of B-fresher things
 *  - Save B metadata
 *  - If A unchanged during that operation, apply bucket to A; else re-merge selectively (we implement re-merge by applying bucket conditionally)
 */
export async function sync(prefix: string, a: IPersistence, b: IPersistence): Promise<void> {
    // Load metadata
    const metaA = await loadMetadata(prefix, a);
    const metaB = await loadMetadata(prefix, b);
    if (!metaA || !metaB) return;

    // If metadata updatedAt equal -> no-op
    if (toMillis(metaA.updatedAt) === toMillis(metaB.updatedAt)) return;

    // Snapshot updateTime for A for two-way consistency check
    const updateTimeA = new Date(metaA.updatedAt);

    const keysA = Object.keys(metaA.entityKeys);
    const keysB = Object.keys(metaB.entityKeys);

    const missingInB = keysA.filter(k => !keysB.includes(k));
    const missingInA = keysB.filter(k => !keysA.includes(k));
    const mismatchedKeys = keysA.filter(k => keysB.includes(k) && metaA.entityKeys[k].hash !== metaB.entityKeys[k].hash);

    // 1) Copy missing keys A -> B
    for (const entityKeyStr of missingInB) {
        const entityKey = EntityKey.from(entityKeyStr);
        await copyEntityKeyFile(prefix, a, b, entityKey, metaB, metaA);
    }

    // 2) Copy missing keys B -> A immediately? In original code this was deferred and handled after
    //    we will keep same behavior: collect missingInA to be processed later (after B side saved)

    // 3) Reconcile mismatched keys: for each mismatched key, load dataA & dataB, call reconcileEntityKey
    const bucketA: BucketEntry[] = [];

    for (const entityKeyStr of mismatchedKeys) {
        const entityKey = EntityKey.from(entityKeyStr);
        const dataA = await a.loadData(entityKey);
        const dataB = await b.loadData(entityKey);
        if (!dataA || !dataB) continue;
        // reconcile: decide what to write into B, and collect bucket items for A
        await reconcileEntityKey(entityKey, dataA, dataB, bucketA);

        // write updated dataB and update metadata B
        sortEntityKeyData(dataB);
        await b.storeData(entityKey, dataB);
        updateEntityKeyMeta(metaB, entityKeyStr, dataB);
    }

    // Save metadata for B once after all reconciliations
    await saveMetadata(prefix, b, metaB);

    // Reload metadata from A to check whether A changed while we were syncing B
    const updatedMetaA = await loadMetadata(prefix, a);
    if (!updatedMetaA) return;

    // If A unchanged -> safe to apply bucket to A as-is (and handle missingInA)
    if (toMillis(updatedMetaA.updatedAt) === toMillis(updateTimeA)) {
        // First handle missingInA by copying from B -> A
        for (const entityKeyStr of missingInA) {
            const entityKey = EntityKey.from(entityKeyStr);
            const dataB = await b.loadData(entityKey);
            if (!dataB) continue;
            await a.storeData(entityKey, dataB);
            updatedMetaA.entityKeys[entityKeyStr] = { ...metaB.entityKeys[entityKeyStr] };
            updateEntityKeyMeta(updatedMetaA, entityKeyStr, dataB);
        }
        // Apply bucket (B-fresher items) to A
        await applyBucket(prefix, a, bucketA, updatedMetaA);
        // Save final metadata A
        await saveMetadata(prefix, a, updatedMetaA);
    } else {
        // A changed during sync -> we must merge carefully:
        // Approach: for missingInA, if file absent in A now -> copy from B; if present -> do a selective merge using B's newer entities.
        for (const entityKeyStr of missingInA) {
            const entityKey = EntityKey.from(entityKeyStr);
            const dataB = await b.loadData(entityKey);
            const dataA = await a.loadData(entityKey);
            if (!dataB) continue;
            if (!dataA) {
                // A still missing -> copy fully from B
                await a.storeData(entityKey, dataB);
                updatedMetaA.entityKeys[entityKeyStr] = { ...metaB.entityKeys[entityKeyStr] };
                updateEntityKeyMeta(updatedMetaA, entityKeyStr, dataB);
                await saveMetadata(prefix, a, updatedMetaA);
                continue;
            }
            // If both exist, apply selective merge: for each entity in B, apply if newer than A
            if (!dataA.deleted) dataA.deleted = {};
            for (const entityNameStr of Object.keys(dataB)) {
                if (entityNameStr === "deleted") continue;
                const entityName = entityNameStr as EntityName;
                const entitiesB = dataB[entityName] || {};
                const entitiesA = dataA[entityName] || {};
                for (const id of Object.keys(entitiesB)) {
                    const entB = entitiesB[id];
                    const entA = entitiesA[id];
                    if (
                        !entA ||
                        (entB.version ?? 0) > (entA.version ?? 0) ||
                        ((entB.version ?? 0) === (entA.version ?? 0) && toMillis(entB.updatedAt) > toMillis(entA.updatedAt))
                    ) {
                        if (!dataA[entityName]) dataA[entityName] = {};
                        dataA[entityName][id] = entB;
                        if (dataA.deleted[entityName] && dataA.deleted[entityName][id]) {
                            delete dataA.deleted[entityName][id];
                        }
                    }
                }
            }
            // Handle deletions from B
            const deletedB = dataB.deleted || {};
            for (const entityNameStr of Object.keys(deletedB)) {
                const entityName = entityNameStr as EntityName;
                const deletedEntitiesB = deletedB[entityName] || {};
                for (const id of Object.keys(deletedEntitiesB)) {
                    const deletionTimeB = deletedEntitiesB[id];
                    const currentDeletedA = dataA.deleted?.[entityName]?.[id];
                    const entityAInActive = dataA[entityName]?.[id];
                    if (!currentDeletedA || toMillis(deletionTimeB) > toMillis(currentDeletedA)) {
                        if (!dataA.deleted) dataA.deleted = {};
                        if (!dataA.deleted[entityName]) dataA.deleted[entityName] = {};
                        dataA.deleted[entityName][id] = deletionTimeB;
                        if (entityAInActive) {
                            delete dataA[entityName][id];
                        }
                    }
                }
            }
            sortEntityKeyData(dataA);
            await a.storeData(entityKey, dataA);
            updateEntityKeyMeta(updatedMetaA, entityKeyStr, dataA);
            await saveMetadata(prefix, a, updatedMetaA);
        }

        // Now handle bucket: apply entries only if they are still newer than what's in A
        // Build grouped bucket and filter per-entity by timestamp/version (reuse applyBucket logic but pre-filter)
        const filteredBucket: BucketEntry[] = [];

        // Group bucket entries and evaluate against latest A files
        const bucketByKey: { [k: string]: BucketEntry[] } = {};
        for (const bItem of bucketA) {
            const keyStr = bItem.entityKey.toString();
            bucketByKey[keyStr] = bucketByKey[keyStr] || [];
            bucketByKey[keyStr].push(bItem);
        }

        for (const keyStr of Object.keys(bucketByKey)) {
            const entityKey = EntityKey.from(keyStr);
            const dataAfile = await a.loadData(entityKey);
            if (!dataAfile) {
                // If A file missing now, we can apply all bucket entries
                filteredBucket.push(...bucketByKey[keyStr]);
                continue;
            }
            for (const item of bucketByKey[keyStr]) {
                const entityName = item.entityName;
                const id = item.entityId;
                if (typeof item.entity === "string") {
                    // deletion: apply only if deletion is newer than existing deleted marker or entity updatedAt
                    const existingDeleted = dataAfile.deleted?.[entityName]?.[id];
                    const existingEntity = dataAfile[entityName]?.[id];
                    if (!existingDeleted || toMillis(item.entity) > toMillis(existingDeleted)) {
                        if (!existingEntity || toMillis(item.entity) >= toMillis(existingEntity.updatedAt)) {
                            filteredBucket.push(item);
                        }
                    }
                } else {
                    // entity object: apply only if newer than existing entity or deletion
                    const existingEntity = dataAfile[entityName]?.[id];
                    const existingDeleted = dataAfile.deleted?.[entityName]?.[id];
                    const shouldApply =
                        !existingEntity ||
                        (item.entity.version ?? 0) > (existingEntity.version ?? 0) ||
                        ((item.entity.version ?? 0) === (existingEntity.version ?? 0) && toMillis(item.entity.updatedAt) > toMillis(existingEntity.updatedAt));
                    if (shouldApply && (!existingDeleted || toMillis(item.entity.updatedAt) > toMillis(existingDeleted))) {
                        filteredBucket.push(item);
                    }
                }
            }
        }

        // apply filteredBucket to A using applyBucket function
        await applyBucket(prefix, a, filteredBucket, updatedMetaA);
        // final save metadata
        await saveMetadata(prefix, a, updatedMetaA);
    }

    // Finalization: optionally ensure B metadata is in sync with A (depends on your overall system). We'll write metaB again to be safe.
    await saveMetadata(prefix, b, metaB);

    // Done
}

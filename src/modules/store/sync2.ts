import type { Metadata } from "./entities/Metadata";
import type { Entity, EntityName } from "./interfaces/Entity";
import type { EntityKeyData } from "./interfaces/EntityKeyData";
import type { IPersistence } from "./interfaces/IPersistence";

class PersistenceCacheWrapper implements IPersistence {

    private persistence: IPersistence;
    private cache: Record<string, EntityKeyData>;
    private ops: Record<string, EntityKeyData | null>;

    constructor(persistence: IPersistence) {
        this.persistence = persistence;
        this.cache = {};
        this.ops = {};
    }

    async loadData(entityKey: string): Promise<EntityKeyData | null> {
        const key = entityKey.toString();
        if (this.cache[key]) {
            return Promise.resolve(this.cache[key]);
        }

        const data = await this.persistence.loadData(entityKey);
        if (data) {
            this.cache[key] = data;
        }
        return data;
    }
    async storeData(entityKey: string, data: EntityKeyData): Promise<void> {
        this.ops[entityKey] = data;
        this.cache[entityKey] = data;
    }

    async clearData(entityKey: string): Promise<void> {
        this.ops[entityKey] = null;
        delete this.cache[entityKey];
    }

    async executeOps(): Promise<void> {
        const promises = Object.entries(this.ops).map(([key, data]) => {
            if (data) return this.persistence.storeData(key, data);
            else return this.clearData(key);
        });
        return Promise.all(promises).then(() => undefined);
    }
}

interface TypedEntityKeyData {
    [entityName: string]: {
        [id: string]: { type: "active", data: Entity } | { type: "deleted", deletedAt: Date }
    }
}

export class SyncHandler {

    private prefix: string;
    private persistenceA: PersistenceCacheWrapper;
    private persistenceB: PersistenceCacheWrapper;
    private metadataA: Metadata | undefined;
    private metadataB: Metadata | undefined;
    private EntityKeyDataMapA: Record<string, EntityKeyData> = {};
    private EntityKeyDataMapB: Record<string, EntityKeyData> = {};

    static sync = (prefix: string, persistenceA: IPersistence, persistenceB: IPersistence): Promise<void> => new SyncHandler(prefix, persistenceA, persistenceB).sync();

    private constructor(prefix: string, persistenceA: IPersistence, persistenceB: IPersistence) {
        this.prefix = prefix;
        this.persistenceA = new PersistenceCacheWrapper(persistenceA);
        this.persistenceB = new PersistenceCacheWrapper(persistenceB);
    }

    private async loadMetadata(): Promise<void> {
        const [metaA, metaB] = await Promise.all([
            SyncHandler.getMetadata(this.prefix, this.persistenceA),
            SyncHandler.getMetadata(this.prefix, this.persistenceB),
        ]);
        this.metadataA = metaA;
        this.metadataB = metaB;
    }

    async sync(): Promise<void> {

        // Step 1: Load and compare metadata.updatedAt
        await this.loadMetadata();

        // return if metadata not loaded or updateAt are the same.
        if (!this.metadataA || !this.metadataB) return;
        if (this.metadataA.updatedAt.getTime() === this.metadataB.updatedAt.getTime()) return;

        // Step 2: partition entityKey to lists of missing items and hash mismatch
        const [entityKeysOnlyInA, entityKeysOnlyInB, entityKeysWithHashMismatch] = SyncHandler.partitionDifferences(
            this.metadataA.entityKeys, this.metadataB.entityKeys,
            (entityKeyA, entityKeyB) => entityKeyA.hash !== entityKeyB.hash
        );

        await Promise.all([
            this.loadEntityKeyData('A', [...Object.keys(entityKeysOnlyInA), ...Object.keys(entityKeysWithHashMismatch)]),
            this.loadEntityKeyData('B', [...Object.keys(entityKeysWithHashMismatch)]),
        ])

        await this.storeMissingEntityKeys('B', Object.keys(entityKeysOnlyInA));

        // Step 3: Keys present in both but with hash mismatch (resolve)
        for (const key of Object.keys(entityKeysWithHashMismatch)) {
            const dataA = this.EntityKeyDataMapA[key];
            const dataB = this.EntityKeyDataMapB[key];
            if (!dataA || !dataB) continue; // no-op we'll always have data if we reach here.

            const typedDataA = this.convertToTypedData(dataA);
            const typedDataB = this.convertToTypedData(dataB);

            const [entityNamesOnlyInA, entityNamesOnlyInB, entityNamesInBoth] = SyncHandler.partitionDifferences(
                typedDataA, typedDataB, () => true
            )

            Object.keys(entityNamesOnlyInA).forEach(name => {
                const entityName = name as EntityName;
                dataB[entityName] = dataA[entityName];
                this.metadataB!.entityKeys[key].entities[entityName] = this.metadataA!.entityKeys[key].entities[entityName];
            })

            for (const [name, [entitiesA, entitiesB]] of Object.entries(entityNamesInBoth)) {
                const entityName = name as EntityName;
                const [entitiesOnlyInA, entitiesOnlyInB, entitiesWithVersionMismatch] = SyncHandler.partitionDifferences(
                    entitiesA, entitiesB,
                    (left, right) => left.version !== right.version || left.updatedAt?.getTime() !== right.updatedAt?.getTime()
                )

                Object.entries(entitiesOnlyInA).forEach(([id, entity]) => {
                    const deletionTimeB = deletedDataB[entityName]?.[id];
                    // deleted in B
                    if (deletionTimeB) {
                        // deletion in B is newer than entity in A
                        if (deletionTimeB.getTime() >= (entity.updatedAt?.getTime() ?? 0)) {
                            // add to A bucket - delete
                        } else {
                            dataB[entityName]![id] = entity;
                        }
                    }
                });
            }
        }
    }

    convertToTypedData(data: EntityKeyData): TypedEntityKeyData {
        const typedData: TypedEntityKeyData = {};
        for (const entityName of Object.keys(data) as EntityName[]) {
            typedData[entityName] = {};
            const entities = data[entityName] || {};
            for (const id of Object.keys(entities)) {
                typedData[entityName][id] = { type: "active", data: entities[id] };
            }
        }
        if (data.deleted) {
            for (const entityName of Object.keys(data.deleted) as EntityName[]) {
                if (!typedData[entityName]) typedData[entityName] = {};
                const entities = data.deleted[entityName] || {};
                for (const id of Object.keys(entities)) {
                    typedData[entityName][id] = { type: "deleted", deletedAt: entities[id] };
                }
            }
        }
        return typedData;
    }

    async loadEntityKeyData(inPersistence: 'A' | 'B', entityKeys: string[]): Promise<void> {
        const target = inPersistence === 'A' ? this.persistenceA : this.persistenceB;
        const entityKeyDataMap = inPersistence === 'A' ? this.EntityKeyDataMapA : this.EntityKeyDataMapB;
        await Promise.all(entityKeys.map(entityKey => target.loadData(entityKey)
            .then(data => {
                if (data) entityKeyDataMap[entityKey] = data;
            })
        ));
    }

    async storeMissingEntityKeys(inPersistence: 'A' | 'B', entityKeys: string[]): Promise<void> {
        const target = inPersistence === 'A' ? this.persistenceA : this.persistenceB;
        const sourceMap = inPersistence === 'A' ? this.EntityKeyDataMapB : this.EntityKeyDataMapA;
        const targetMetadata = inPersistence === 'A' ? this.metadataA : this.metadataB;
        const sourceMetadata = inPersistence === 'A' ? this.metadataB : this.metadataA;

        const keyVsEntityData = entityKeys
            .map(entityKey => ({ key: entityKey, data: sourceMap[entityKey] }))
            .filter(row => row.data);

        await Promise.all(keyVsEntityData.map(row =>
            target.storeData(row.key, row.data!)
                .then(() => targetMetadata!.entityKeys[row.key] = sourceMetadata!.entityKeys[row.key])
        ));

    }

    private static partitionDifferences<T>(
        left: { [key: string]: T },
        right: { [key: string]: T },
        ...filters: ((left: T, right: T) => boolean)[]
    ): [Record<string, T>, Record<string, T>, ...Array<Record<string, [T, T]>>] {

        const onlyLeft: Record<string, T> = {};
        const onlyRight: Record<string, T> = {};
        const filterResults: Array<Record<string, [left: T, right: T]>> = Array(filters.length).fill({});

        const leftKeys = Object.keys(left);
        const rightKeys = Object.keys(right);

        let i = 0;
        let j = 0;
        while (i < leftKeys.length && j < rightKeys.length) {
            const lId = leftKeys[i];
            const rId = rightKeys[j];

            if (lId === rId) {
                filters.forEach((filter, index) => {
                    if (filter(left[lId], right[rId])) filterResults[index][lId] = [left[lId], right[rId]];
                })
                i++;
                j++;

            } else if (lId.localeCompare(rId) < 0) {
                onlyLeft[lId] = left[lId];
                i++;

            } else {
                onlyRight[rId] = right[rId];
                j++;
            }
        }

        // Remaining left items
        while (i < leftKeys.length) {
            const lId = leftKeys[i];
            onlyLeft[lId] = left[lId];
            i++;
        }

        // Remaining right items
        while (j < rightKeys.length) {
            const rId = rightKeys[j];
            onlyRight[rId] = right[rId];
            j++;
        }

        return [onlyLeft, onlyRight, ...filterResults];
    }

    private static async getMetadata(prefix: string, persistence: IPersistence): Promise<Metadata> {
        const metadataKey = `${prefix}.metadata`;
        const data = await persistence.loadData(metadataKey);
        if (data && data.Metadata) return Object.values(data.Metadata)[0] as Metadata;

        const defaultMetadata: Metadata = {
            updatedAt: new Date(0),
            entityKeys: {}
        }
        await SyncHandler.storeMetadata(prefix, persistence, defaultMetadata);
        return defaultMetadata;
    }

    private static async storeMetadata(prefix: string, persistence: IPersistence, metadata: Metadata): Promise<void> {
        const metadataKey = `${prefix}.metadata`;
        metadata.id = 'id';
        metadata.entityKeys = SyncHandler.sortKeys(metadata.entityKeys);

        const entityKeyData: EntityKeyData = { Metadata: {} };
        entityKeyData.Metadata![metadata.id!] = metadata;
        await persistence.storeData(metadataKey, entityKeyData);
    }

    private static sortKeys<T>(obj: Record<string, T>): Record<string, T> {
        return Object.keys(obj).sort()
            .reduce((sorted, key) => {
                sorted[key] = obj[key];
                return sorted;
            }, {} as Record<string, T>);
    }

}
import type { EntityMetadata, Metadata } from "./entities/Metadata";
import type { Entity, EntityName } from "./interfaces/Entity";
import type { EntityKeyData } from "./interfaces/EntityKeyData";
import type { IPersistence } from "./interfaces/IPersistence";
import { Utils } from "./utils";

type TypedEntityKeyData = {
    [entityName: string]: {
        [id: string]: TypedEntity
    }
}

type TypedEntity = { type: "active", data: Entity } | { type: "deleted", deletedAt: Date };

// entityKey vs <entity id vs ops> | 'copy'
type DifferenceBucket = Record<string, DifferenceOps>;
type DifferenceOps = Record<string, DifferenceOp> | 'copy';
type DifferenceOp =
    | { type: 'save', entityName: EntityName, data: Entity }
    | { type: 'delete', entityName: EntityName, deletedAt: Date }

export class SyncHandler {

    private prefix: string;
    private persistenceA: IPersistence;
    private persistenceB: IPersistence;
    private metadataA: Metadata | undefined;
    private metadataB: Metadata | undefined;
    private EntityKeyDataMapA: Record<string, EntityKeyData> = {};
    private EntityKeyDataMapB: Record<string, EntityKeyData> = {};
    private bucketA: DifferenceBucket = {};
    private bucketB: DifferenceBucket = {};

    static sync = (prefix: string, persistenceA: IPersistence, persistenceB: IPersistence): Promise<void> => new SyncHandler(prefix, persistenceA, persistenceB).sync();

    private constructor(prefix: string, persistenceA: IPersistence, persistenceB: IPersistence) {
        this.prefix = prefix;
        this.persistenceA = persistenceA;
        this.persistenceB = persistenceB;
    }

    private async loadMetadata(): Promise<void> {
        const [metaA, metaB] = await Promise.all([
            SyncHandler.getMetadata(this.prefix, this.persistenceA),
            SyncHandler.getMetadata(this.prefix, this.persistenceB),
        ]);
        this.metadataA = metaA;
        this.metadataB = metaB;
    }

    private async sync(): Promise<void> {

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
        ]);

        Object.keys(entityKeysOnlyInA).forEach(entityKey => this.bucketB[entityKey] = 'copy');
        Object.keys(entityKeysOnlyInB).forEach(entityKey => this.bucketA[entityKey] = 'copy');

        this.findDifferenceBuckets(Object.keys(entityKeysWithHashMismatch));
        await this.applyBucket('B');

        const newMetadataA = await SyncHandler.getMetadata(this.prefix, this.persistenceA);
        if (this.metadataA.updatedAt.getTime() === newMetadataA.updatedAt.getTime()) {
            await this.applyBucket('A');
        }

    }

    private async applyBucket(inPersistence: 'A' | 'B'): Promise<void> {
        const bucket = inPersistence === 'A' ? this.bucketA : this.bucketB;
        await Promise.all(Object.entries(bucket).map(([entityKey, ops]) => this.applyOps(inPersistence, entityKey, ops)));

        const target = inPersistence === 'A' ? this.persistenceA : this.persistenceB;
        const targetMetadata = inPersistence === 'A' ? this.metadataA : this.metadataB;
        if (!targetMetadata) throw new Error('Metadata not loaded');
        targetMetadata.updatedAt = new Date();
        await SyncHandler.storeMetadata(this.prefix, target, targetMetadata);
    }

    private async applyOps(inPersistence: 'A' | 'B', entityKey: string, ops: DifferenceOps): Promise<void> {
        const target = inPersistence === 'A' ? this.persistenceA : this.persistenceB;
        const sourceMetadata = inPersistence === 'A' ? this.metadataB : this.metadataA;
        const targetMetadata = inPersistence === 'A' ? this.metadataA : this.metadataB;
        const sourceEntityKeyDataMap = inPersistence === 'A' ? this.EntityKeyDataMapB : this.EntityKeyDataMapA;
        const targetEntityKeyDataMap = inPersistence === 'A' ? this.EntityKeyDataMapA : this.EntityKeyDataMapB;

        if (!targetMetadata || !sourceMetadata) throw new Error('Metadata not loaded');

        if (ops === 'copy') {
            const data = sourceEntityKeyDataMap[entityKey];
            if (data) await target.storeData(entityKey, data);
            targetMetadata.entityKeys[entityKey] = sourceMetadata.entityKeys[entityKey];
            targetMetadata.entityKeys[entityKey].updatedAt = new Date();
            return;
        }

        const entityKeyData = targetEntityKeyDataMap[entityKey];
        if (!entityKeyData) throw new Error(`EntityKeyData not loaded for ${entityKey}`);

        Object.entries(ops).forEach(([id, op]) => {
            if (op.type === 'save') {
                if (entityKeyData[op.entityName] === undefined) entityKeyData[op.entityName] = {};
                entityKeyData[op.entityName]![id] = op.data;

                if (entityKeyData.deleted && entityKeyData.deleted[op.entityName]) {
                    delete entityKeyData.deleted[op.entityName]![id];
                }

            } else if (op.type === 'delete') {
                if (entityKeyData.deleted === undefined) entityKeyData.deleted = {};

                if (entityKeyData.deleted[op.entityName] === undefined) entityKeyData.deleted[op.entityName] = {};

                entityKeyData.deleted[op.entityName]![id] = op.deletedAt;

                if (entityKeyData[op.entityName] && entityKeyData[op.entityName]![id]) {
                    delete entityKeyData[op.entityName]![id];
                }
            }
        });

        this.updateEntityKeyMetadata(entityKey, entityKeyData, targetMetadata);
        await target.storeData(entityKey, entityKeyData);
    }

    private updateEntityKeyMetadata(entityKey: string, entityKeyData: EntityKeyData, metadata: Metadata) {
        const updatedAt = new Date();
        const entities: Record<string, EntityMetadata> = {};
        Object.keys(entityKeyData).forEach(k => {
            if (k === 'deleted') {
                entityKeyData[k] = SyncHandler.sortKeys(entityKeyData[k]!);
                return;
            } else {
                const entityName = k as EntityName;
                entityKeyData[entityName] = SyncHandler.sortKeys(entityKeyData[entityName]!);
                entities[entityName] = {
                    count: Object.keys(entityKeyData[entityName] || {}).length,
                    deletedCount: entityKeyData.deleted && entityKeyData.deleted[entityName] ? Object.keys(entityKeyData.deleted[entityName]!).length : 0
                }
            }
        });
        const hash = Utils.generateHash(JSON.stringify(entityKeyData));
        metadata.entityKeys[entityKey] = { hash, updatedAt, entities };
    }

    private addDifferenceOp(bucket: DifferenceBucket, entityKey: string, id: string, op: DifferenceOp) {
        if (bucket[entityKey] === undefined) bucket[entityKey] = {};
        if (bucket[entityKey] === 'copy') throw new Error(`Cannot add difference op to entityKey ${entityKey} marked as 'copy'`);
        bucket[entityKey][id] = op;
    }

    private addEntityNamesToBucket(missingEntityNames: TypedEntityKeyData, bucket: DifferenceBucket, entityKey: string) {
        Object.entries(missingEntityNames).forEach(([entityName, entities]) => (
            this.addEntitiesToBucket(entities, bucket, entityKey, entityName as EntityName)
        ));
    }

    private addEntitiesToBucket(missingEntities: Record<string, TypedEntity>, bucket: DifferenceBucket, entityKey: string, entityName: EntityName) {
        Object.entries(missingEntities).forEach(([id, typedEntity]) => {
            this.addDifferenceOp(bucket, entityKey, id, typedEntity.type === 'active'
                ? { type: 'save', entityName: entityName as EntityName, data: typedEntity.data }
                : { type: 'delete', entityName: entityName as EntityName, deletedAt: typedEntity.deletedAt });
        })
    }

    private resolveEntity(id: string, entityKey: string, entityName: EntityName, a: TypedEntity, b: TypedEntity) {
        // Extract timestamps
        let timeA = a.type === 'active' ? a.data.updatedAt?.getTime() : a.deletedAt?.getTime();
        let timeB = b.type === 'active' ? b.data.updatedAt?.getTime() : b.deletedAt?.getTime();

        if (timeA === undefined) timeA = new Date(0).getTime();
        if (timeB === undefined) timeB = new Date(0).getTime();

        if (timeA === timeB) {
            if (a.type === b.type) return; // nothing to do
            if (a.type === 'deleted') this.addDifferenceOp(this.bucketB, entityKey, id, { type: 'delete', entityName, deletedAt: a.deletedAt });
            else if (b.type === 'deleted') this.addDifferenceOp(this.bucketA, entityKey, id, { type: 'delete', entityName, deletedAt: b.deletedAt });
            return;
        }

        if (timeA > timeB) {
            // A is newer → update B
            if (a.type === 'active') this.addDifferenceOp(this.bucketB, entityKey, id, { type: 'save', entityName, data: a.data });
            else this.addDifferenceOp(this.bucketB, entityKey, id, { type: 'delete', entityName, deletedAt: a.deletedAt });
        } else {
            // B is newer → update A
            if (b.type === 'active') this.addDifferenceOp(this.bucketA, entityKey, id, { type: 'save', entityName, data: b.data });
            else this.addDifferenceOp(this.bucketA, entityKey, id, { type: 'delete', entityName, deletedAt: b.deletedAt });
        }
    }

    private findDifferenceBuckets(entityKeysWithHashMismatch: string[]) {
        for (const entityKey of entityKeysWithHashMismatch) {
            const dataA = this.EntityKeyDataMapA[entityKey];
            const dataB = this.EntityKeyDataMapB[entityKey];
            if (!dataA || !dataB) continue; // no-op we'll always have data if we reach here.

            const typedDataA = this.convertToTypedData(dataA);
            const typedDataB = this.convertToTypedData(dataB);

            if (this.bucketA[entityKey] === undefined) this.bucketA[entityKey] = {};
            if (this.bucketB[entityKey] === undefined) this.bucketB[entityKey] = {};

            const [entityNamesOnlyInA, entityNamesOnlyInB, entityNamesInBoth] = SyncHandler.partitionDifferences(
                typedDataA, typedDataB, () => true
            )

            this.addEntityNamesToBucket(entityNamesOnlyInA, this.bucketB, entityKey);
            this.addEntityNamesToBucket(entityNamesOnlyInB, this.bucketA, entityKey);

            for (const [name, [entitiesA, entitiesB]] of Object.entries(entityNamesInBoth)) {
                const entityName = name as EntityName;
                const [
                    entitiesOnlyInA,
                    entitiesOnlyInB,
                    commonEntities
                ] = SyncHandler.partitionDifferences(
                    entitiesA, entitiesB,
                    () => true,
                )

                this.addEntitiesToBucket(entitiesOnlyInA, this.bucketB, entityKey, entityName);
                this.addEntitiesToBucket(entitiesOnlyInB, this.bucketA, entityKey, entityName);
                Object.entries(commonEntities).forEach(([id, [typedEntityA, typedEntityB]]) =>
                    this.resolveEntity(id, entityKey, entityName, typedEntityA, typedEntityB));

            }
        }
    }

    private convertToTypedData(data: EntityKeyData): TypedEntityKeyData {
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

    private async loadEntityKeyData(inPersistence: 'A' | 'B', entityKeys: string[]): Promise<void> {
        const target = inPersistence === 'A' ? this.persistenceA : this.persistenceB;
        const entityKeyDataMap = inPersistence === 'A' ? this.EntityKeyDataMapA : this.EntityKeyDataMapB;
        await Promise.all(entityKeys.map(entityKey => target.loadData(entityKey)
            .then(data => {
                if (data) entityKeyDataMap[entityKey] = data;
            })
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
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/modules/base-ui/components/ui/button";
import React, { useState } from "react";
import { MyPersistence } from "../../dump/MyPersistence";
import { EntityKey } from "../../store/interfaces/EntityKey";
import type { EntityKeyData } from "../../store/interfaces/EntityKeyData";
import { sync } from "../../store/sync";

const persistenceA = new MyPersistence('PersistenceA');
const persistenceB = new MyPersistence('PersistenceB');

const getAllKeys = (persistence: MyPersistence): string[] => {
    // Return all keys in the persistence store
    return Array.from(persistence["store"].keys());
};

const getKeyData = async (persistence: MyPersistence, keyStr: string): Promise<EntityKeyData | null> => {
    const key = EntityKey.from(keyStr);
    return await persistence.loadData(key);
};

const PersistenceTesting: React.FC = () => {
    const prefix = 'my-app';
    const [dataA, setDataA] = useState<Record<string, EntityKeyData | null>>({});
    const [dataB, setDataB] = useState<Record<string, EntityKeyData | null>>({});
    const [loading, setLoading] = useState(false);
    const [syncTime, setSyncTime] = useState<number | null>(null);
    const [newKeyA, setNewKeyA] = useState("");
    const [newKeyB, setNewKeyB] = useState("");

    const loadData = async () => {
        setLoading(true);
        const keysA = getAllKeys(persistenceA);
        const keysB = getAllKeys(persistenceB);
        const dataAObj: Record<string, EntityKeyData | null> = {};
        const dataBObj: Record<string, EntityKeyData | null> = {};
        for (const key of keysA) {
            dataAObj[key] = await getKeyData(persistenceA, key);
        }
        for (const key of keysB) {
            dataBObj[key] = await getKeyData(persistenceB, key);
        }
        setDataA(dataAObj);
        setDataB(dataBObj);
        setLoading(false);
    };

    const handleSync = async () => {
        setLoading(true);
        setSyncTime(null);
        const start = performance.now();
        await sync(prefix, persistenceB, persistenceA);
        const end = performance.now();
        setSyncTime(end - start);
        await loadData();
        setLoading(false);
    };

    const handleAddKey = async (persistence: MyPersistence, key: string, reload: () => void) => {
        if (!key) return;
        await persistence.storeData(EntityKey.from(key), {});
        reload();
    };

    const handleRemoveKey = async (persistence: MyPersistence, key: string, reload: () => void) => {
        if (!key) return;
        await persistence.clearData(EntityKey.from(key));
        reload();
    };

    return (
        <div style={{ width: '100vw', minHeight: '100vh', margin: 0, padding: 32, boxSizing: 'border-box' }}>
            <h1 style={{ textAlign: "center" }}>Persistence Testing</h1>
            <div style={{ display: "flex", justifyContent: "center", gap: 16, margin: "24px 0" }}>
                <Button onClick={handleSync} disabled={loading} style={{ padding: "12px 32px", fontSize: 18 }}>
                    {loading ? "Syncing..." : "Sync"}
                </Button>
                <Button onClick={loadData} disabled={loading} style={{ padding: "12px 32px", fontSize: 18 }}>
                    {loading ? "Reloading..." : "Reload Data"}
                </Button>
            </div>
            {syncTime !== null && (
                <div style={{ textAlign: "center", marginBottom: 16 }}>
                    <strong>Sync completed in {syncTime.toFixed(2)} ms</strong>
                </div>
            )}
            <div style={{ display: "flex", gap: 48 }}>
                <div style={{ flex: 1, border: "1px solid #ccc", borderRadius: 8, padding: 24 }}>
                    <h2 style={{ textAlign: "center" }}>Persistence A</h2>
                    <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                        <span style={{ fontSize: 16, alignSelf: 'center' }}>{prefix}.</span>
                        <input
                            type="text"
                            value={newKeyA}
                            onChange={e => setNewKeyA(e.target.value)}
                            placeholder="Entity Key"
                            style={{ padding: "6px 8px", fontSize: 16 }}
                        />
                        <Button onClick={() => handleAddKey(persistenceA, `${prefix}.${newKeyA}`, loadData)} disabled={loading || !newKeyA} title="Add Key">
                            <span role="img" aria-label="add">➕</span>
                        </Button>
                        <Button onClick={() => handleRemoveKey(persistenceA, `${prefix}.${newKeyA}`, loadData)} disabled={loading || !newKeyA} title="Remove Key">
                            <span role="img" aria-label="remove">🗑️</span>
                        </Button>
                    </div>
                    {/* Reload Data button moved to top */}
                    {Object.keys(dataA).length === 0 ? <p>No data loaded.</p> : (
                        Object.entries(dataA).map(([key, keyData]) => {
                            // Special handling for metadata keys
                            const metaEntityKeys = key.endsWith('.metadata')
                                ? (keyData?.Metadata?.id && typeof keyData.Metadata.id === 'object' && 'entityKeys' in keyData.Metadata.id ? (keyData.Metadata.id.entityKeys as Record<string, any>) : undefined)
                                : undefined;
                            if (metaEntityKeys) {
                                const metaUpdatedAt = keyData?.Metadata?.id?.updatedAt;
                                return (
                                    <div key={key} style={{ marginBottom: 16 }}>
                                        <strong>Metadata for {key}</strong>
                                        <div style={{ marginLeft: 16 }}>
                                            <div>
                                                <strong>updatedAt:</strong> {metaUpdatedAt ? new Date(metaUpdatedAt).toLocaleString() : "-"}
                                            </div>
                                            <div><strong>Entity Keys:</strong></div>
                                            <ul>
                                                {Object.entries(metaEntityKeys).map(([ekey, edata]) => (
                                                    <li key={ekey}>
                                                        {ekey} &rarr; updatedAt: {edata.updatedAt ? new Date(edata.updatedAt).toLocaleString() : "-"}
                                                        {edata.hash && <span> &nbsp; hash: {edata.hash}</span>}
                                                    </li>
                                                ))}
                                            </ul>
                                            <div><strong>Entities:</strong></div>
                                            <ul>
                                                {Object.entries(metaEntityKeys).flatMap(([ekey, edata]) => (
                                                    Object.entries(edata.entities || {}).map(([ename, estats]) => {
                                                        const stats = typeof estats === 'object' ? estats as { count?: number; deletedCount?: number } : {};
                                                        return (
                                                            <li key={ekey + ename}>
                                                                {ename} &rarr; count: {stats.count ?? '-'}, deletedCount: {stats.deletedCount ?? '-'}
                                                            </li>
                                                        );
                                                    })
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                );
                            }
                            // Normal entity key display
                            return (
                                <div key={key} style={{ marginBottom: 16 }}>
                                    <strong>Key:</strong> {key}
                                    {keyData ? Object.entries(keyData).filter(([name]) => name !== "deleted" && name !== "hash").map(([entityName, entities]) => (
                                        <div key={entityName} style={{ marginLeft: 16 }}>
                                            <strong>Entity:</strong> {entityName}
                                            <ul>
                                                {Object.entries(entities as Record<string, { updatedAt?: number }>).
                                                    map(([id, entity]) => (
                                                        <li key={id}>
                                                            {id} &rarr; {entity.updatedAt ? new Date(entity.updatedAt).toLocaleString() : "-"}
                                                        </li>
                                                    ))}
                                            </ul>
                                        </div>
                                    )) : <div>No entities.</div>}
                                </div>
                            );
                        })
                    )}
                </div>
                <div style={{ flex: 1, border: "1px solid #ccc", borderRadius: 8, padding: 24 }}>
                    <h2 style={{ textAlign: "center" }}>Persistence B</h2>
                    <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                        <span style={{ fontSize: 16, alignSelf: 'center' }}>{prefix}.</span>
                        <input
                            type="text"
                            value={newKeyB}
                            onChange={e => setNewKeyB(e.target.value)}
                            placeholder="Entity Key"
                            style={{ padding: "6px 8px", fontSize: 16 }}
                        />
                        <Button onClick={() => handleAddKey(persistenceB, `${prefix}.${newKeyB}`, loadData)} disabled={loading || !newKeyB} title="Add Key">
                            <span role="img" aria-label="add">➕</span>
                        </Button>
                        <Button onClick={() => handleRemoveKey(persistenceB, `${prefix}.${newKeyB}`, loadData)} disabled={loading || !newKeyB} title="Remove Key">
                            <span role="img" aria-label="remove">🗑️</span>
                        </Button>
                    </div>
                    {/* Reload Data button moved to top */}
                    {Object.keys(dataB).length === 0 ? <p>No data loaded.</p> : (
                        Object.entries(dataB).map(([key, keyData]) => {
                            // Special handling for metadata keys
                            const metaEntityKeys = key.endsWith('.metadata')
                                ? (keyData?.Metadata?.id && typeof keyData.Metadata.id === 'object' && 'entityKeys' in keyData.Metadata.id ? (keyData.Metadata.id.entityKeys as Record<string, any>) : undefined)
                                : undefined;
                            if (metaEntityKeys) {
                                const metaUpdatedAt = keyData?.Metadata?.id?.updatedAt;
                                return (
                                    <div key={key} style={{ marginBottom: 16 }}>
                                        <strong>Metadata for {key}</strong>
                                        <div style={{ marginLeft: 16 }}>
                                            <div>
                                                <strong>updatedAt:</strong> {metaUpdatedAt ? new Date(metaUpdatedAt).toLocaleString() : "-"}
                                            </div>
                                            <div><strong>Entity Keys:</strong></div>
                                            <ul>
                                                {Object.entries(metaEntityKeys).map(([ekey, edata]) => (
                                                    <li key={ekey}>
                                                        {ekey} &rarr; updatedAt: {edata.updatedAt ? new Date(edata.updatedAt).toLocaleString() : "-"}
                                                        {edata.hash && <span> &nbsp; hash: {edata.hash}</span>}
                                                    </li>
                                                ))}
                                            </ul>
                                            <div><strong>Entities:</strong></div>
                                            <ul>
                                                {Object.entries(metaEntityKeys).flatMap(([ekey, edata]) => (
                                                    Object.entries(edata.entities || {}).map(([ename, estats]) => {
                                                        const stats = typeof estats === 'object' ? estats as { count?: number; deletedCount?: number } : {};
                                                        return (
                                                            <li key={ekey + ename}>
                                                                {ename} &rarr; count: {stats.count ?? '-'}, deletedCount: {stats.deletedCount ?? '-'}
                                                            </li>
                                                        );
                                                    })
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                );
                            }
                            // Normal entity key display
                            return (
                                <div key={key} style={{ marginBottom: 16 }}>
                                    <strong>Key:</strong> {key}
                                    {keyData ? Object.entries(keyData).filter(([name]) => name !== "deleted" && name !== "hash").map(([entityName, entities]) => (
                                        <div key={entityName} style={{ marginLeft: 16 }}>
                                            <strong>Entity:</strong> {entityName}
                                            <ul>
                                                {Object.entries(entities as Record<string, { updatedAt?: number }>).
                                                    map(([id, entity]) => (
                                                        <li key={id}>
                                                            {id} &rarr; {entity.updatedAt ? new Date(entity.updatedAt).toLocaleString() : "-"}
                                                        </li>
                                                    ))}
                                            </ul>
                                        </div>
                                    )) : <div>No entities.</div>}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default PersistenceTesting;

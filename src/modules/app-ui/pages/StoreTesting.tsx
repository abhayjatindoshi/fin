/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppInitializer } from "@/modules/app/AppInitializer";
import { EntityName } from "@/modules/app/entities/entities";
import { TagSchema, type Tag } from "@/modules/app/entities/Tag";
import { GoogleDriveLogin } from "@/modules/app/store/GoogleDriveLogin";
import { Button } from "@/modules/base-ui/components/ui/Button";
import { Spinner } from "@/modules/base-ui/components/ui/Spinner";
import { DataOrchestrator } from "@/modules/data-sync/DataOrchestrator";
import type { DataRepository } from "@/modules/data-sync/DataRepository";
import { useEffect, useState, type JSX } from "react";


export default function StoreTesting() {
    const [entities, setEntities] = useState<Tag[]>([]);
    const [loadingMessage, setLoadingMessage] = useState<string | null>('Loading...');
    const [repo, setRepo] = useState<DataRepository<any, any, any> | undefined>();
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        initialize();
    }, []);

    const initialize = async (): Promise<void> => {
        while (true) {
            if (AppInitializer.getInstance().status === 'ready') {
                setLoadingMessage(null);
                break;
            }

            let message = 'App status: ' + AppInitializer.getInstance().status;
            if (AppInitializer.getInstance().status === 'loggingIn') {
                message += '; Login status: ' + GoogleDriveLogin.getInstance().status;
            }
            setLoadingMessage(message);

            await AppInitializer.getInstance().load();
        }

        setLoadingMessage('Loading entities...');
        await loadEntities();
        setLoadingMessage(null);
    }

    const loadEntities = async () => {
        const repo = DataOrchestrator.getInstance().repo(EntityName.Tag);
        setRepo(repo);
        const observable = await repo.observeAll();
        observable.subscribe(all => {
            // Map or cast to Tag[] if possible
            return setEntities(all as Tag[]);
        })
    }

    const handleDelete = async (id: string) => {
        await repo?.delete(id);
    };

    const handleCreate = async () => {
        // Simple create logic for demo, customize per entity
        const newEntity: Tag = TagSchema.parse({
            name: 'Tag',
            icon: 'tag-icon',
            referenceId: 'global.1LtPZL27',
        });
        await repo?.save(newEntity);
    };

    const handleUpdate = async (id: string) => {
        // Simple update logic for demo, customize per entity
        const entity = entities.find(e => e.id === id);
        if (!entity) return;
        const updated = { ...entity };
        (updated as Tag).name = ((updated as Tag).name || '') + ' (edited)';
        await repo?.save(updated);
    };

    function InitializeDriveComp({ children }: { children: JSX.Element }) {
        if (loadingMessage) {
            return <div style={{ padding: 24 }}>
                <Spinner /> {loadingMessage}
            </div >
        } else {
            return <>{children}</>
        }
    }

    async function syncNow() {
        setSyncing(true);
        await DataOrchestrator.getInstance().syncNow();
        setSyncing(false);
    }

    return (
        <div style={{ padding: 24 }}>
            <h2>Store Testing</h2>
            <InitializeDriveComp>
                <div style={{ marginTop: 24 }}>
                    <Button onClick={handleCreate}>Create New</Button>
                    <Button disabled={syncing} onClick={syncNow}>Sync Now</Button>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
                        <thead>
                            <tr>
                                {entities.length > 0 &&
                                    Object.keys(entities[0]).map(key => (
                                        <th key={key} style={{ border: '1px solid #ccc', padding: 4 }}>{key}</th>
                                    ))}
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entities.map(entity => {
                                const id = entity.id as string;
                                return (
                                    <tr key={id}>
                                        {Object.keys(entities[0]).map(key => (

                                            <td key={key} style={{ border: '1px solid #eee', padding: 4 }}>{String((entity as any)[key])}</td>
                                        ))}
                                        <td>
                                            <Button onClick={() => handleUpdate(id)} style={{ marginRight: 8 }}>
                                                Edit
                                            </Button>
                                            <Button variant="destructive" onClick={() => handleDelete(id)}>
                                                Delete
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </InitializeDriveComp>
        </div >
    );
}

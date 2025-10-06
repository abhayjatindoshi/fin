/* eslint-disable @typescript-eslint/no-explicit-any */
import { EntityName, util } from "@/modules/app/entities/entities";
import { TagSchema, type Tag } from "@/modules/app/entities/Tag";
import { Button } from "@/modules/base-ui/components/ui/Button";
import { DataOrchestrator } from "@/modules/data-sync/DataOrchestrator";
import { useDataSync } from "@/modules/data-sync/DataSyncProvider";
import type { DateStrategyOptions } from "@/modules/data-sync/strategies/EntityKeyDateStrategy";
import { useEffect, useState } from "react";
import Logo from "../common/Logo";


export default function StoreTesting() {
    const [entities, setEntities] = useState<Tag[]>([]);
    const [syncing, setSyncing] = useState(false);
    const { orchestrator } = useDataSync<typeof util, DateStrategyOptions>();

    useEffect(() => {
        // initialize();
        if (orchestrator) {
            loadEntities();
        }
    }, [orchestrator]);

    // const initialize = async (): Promise<void> => {
    //     while (true) {
    //         const status = GoogleDriveLogin.getInstance().status;
    //         if (status === 'ready') break;
    //         setLoadingMessage(`Login status: ${status}`);
    //         await GoogleDriveLogin.getInstance().op();
    //     }

    //     setLoadingMessage(null);
    //     setPrefix('app');
    // }

    const loadEntities = async () => {
        if (!orchestrator) return;
        const repo = orchestrator.repo(EntityName.Tag);
        const observable = await repo.observeAll();
        observable.subscribe(all => {
            // Map or cast to Tag[] if possible
            return setEntities(all as Tag[]);
        })
    }

    const handleDelete = async (id: string) => {
        if (!orchestrator) return;
        const repo = orchestrator.repo(EntityName.Tag);
        await repo.delete(id);
    };

    const handleCreate = async () => {
        if (!orchestrator) return;
        const repo = orchestrator.repo(EntityName.Tag);
        // Simple create logic for demo, customize per entity
        const newEntity: Tag = TagSchema.parse({
            name: 'Tag',
            icon: 'tag-icon',
            referenceId: 'global.1LtPZL27',
        });
        await repo?.save(newEntity);
    };

    const handleUpdate = async (id: string) => {
        if (!orchestrator) return;
        const repo = orchestrator.repo(EntityName.Tag);
        // Simple update logic for demo, customize per entity
        const entity = entities.find(e => e.id === id);
        if (!entity) return;
        const updated = { ...entity };
        (updated as Tag).name = ((updated as Tag).name || '') + ' (edited)';
        await repo?.save(updated);
    };

    // function InitializeDriveComp({ children }: { children: JSX.Element }) {
    //     if (loadingMessage) {
    //         return <div style={{ padding: 24 }}>
    //             <Spinner /> {loadingMessage}
    //         </div >
    //     } else {
    //         return <>{children}</>
    //     }
    // }

    async function syncNow() {
        setSyncing(true);
        await DataOrchestrator.getInstance().syncNow();
        setSyncing(false);
    }

    return (
        <div style={{ padding: 24 }}>
            <Logo />
            <h2>Store Testing</h2>
            {/* <InitializeDriveComp> */}
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
            {/* </InitializeDriveComp> */}
        </div >
    );
}

import { AppInitializer } from "@/modules/app/AppInitializer";
import type { UserAccount } from "@/modules/app/entities/UserAccount";
import { GoogleDriveLogin } from "@/modules/app/store/GoogleDriveLogin";
import { Button } from "@/modules/base-ui/components/ui/Button";
import { Spinner } from "@/modules/base-ui/components/ui/Spinner";
import { DataOrchestrator } from "@/modules/data-sync/DataOrchestrator";
import type { DataRepository } from "@/modules/data-sync/DataRepository";
import type { DateStrategyOptions } from "@/modules/data-sync/strategies/EntityKeyDateStrategy";
import { useEffect, useState, type JSX } from "react";


export default function StoreTesting() {
    const [entities, setEntities] = useState<UserAccount[]>([]);
    const [loadingMessage, setLoadingMessage] = useState<string | null>('Loading...');
    const [repo, setRepo] = useState<DataRepository<UserAccount, DateStrategyOptions> | undefined>();

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
        const repo = DataOrchestrator.getInstance().repo<UserAccount>('UserAccounts');
        setRepo(repo);
        const observable = await repo.observeAll();
        observable.subscribe(all => {
            setEntities(all);
        })
    }

    const handleDelete = async (id: string) => {
        await repo?.delete(id);
    };

    const handleCreate = async () => {
        // Simple create logic for demo, customize per entity
        const newEntity: UserAccount = {
            name: 'New User',
            email: 'new@example.com',
        }
        await repo?.save(newEntity);
    };

    const handleUpdate = async (id: string) => {
        // Simple update logic for demo, customize per entity
        const entity = entities.find(e => e.id === id);
        if (!entity) return;
        const updated = { ...entity };
        (updated as UserAccount).name = ((updated as UserAccount).name || '') + ' (edited)';
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

    return (
        <div style={{ padding: 24 }}>
            <h2>Store Testing</h2>
            <InitializeDriveComp>
                <div style={{ marginTop: 24 }}>
                    <Button onClick={handleCreate}>Create New</Button>
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
                                        {Object.entries(entity).map(([key, value]) => (
                                            <td key={key} style={{ border: '1px solid #eee', padding: 4 }}>{String(value)}</td>
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

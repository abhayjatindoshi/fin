import type { UserAccount } from '@/modules/store/entities/UserAccount';
import { useEffect, useState } from 'react';
import { Button } from '../../base-ui/components/ui/Button';
import { DataRepository } from '../../store/DataRepository';

export default function StoreTesting() {
    const [entities, setEntities] = useState<UserAccount[]>([]);
    const repo = DataRepository.getInstance('UserAccount');

    useEffect(() => {
        repo.observeAll().then(o => {
            o.subscribe(all => {
                setEntities(all)
            });
        });
    }, []);

    const handleDelete = async (id: string) => {
        await repo.delete(id);
    };

    const handleCreate = async () => {
        // Simple create logic for demo, customize per entity
        const newEntity: UserAccount = {
            name: 'New User',
            email: 'new@example.com',
        }
        await repo.save(newEntity);
    };

    const handleUpdate = async (id: string) => {
        // Simple update logic for demo, customize per entity
        const entity = entities.find(e => e.id === id);
        if (!entity) return;
        const updated = { ...entity };
        (updated as UserAccount).name = ((updated as UserAccount).name || '') + ' (edited)';
        await repo.save(updated);
    };

    return (
        <div style={{ padding: 24 }}>
            <h2>Store Testing</h2>
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
        </div >
    );
}

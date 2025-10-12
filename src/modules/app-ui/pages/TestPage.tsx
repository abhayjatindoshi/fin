/* eslint-disable @typescript-eslint/no-explicit-any */
import { EntityName } from "@/modules/app/entities/entities";
import { TagSchema, type Tag } from "@/modules/app/entities/Tag";
import type { UserAccount } from "@/modules/app/entities/UserAccount";
import { Button } from "@/modules/base-ui/components/ui/button";
import { Spinner } from "@/modules/base-ui/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/modules/base-ui/components/ui/table";
import { DataOrchestrator } from "@/modules/data-sync/DataOrchestrator";
import { useDataSync } from "@/modules/data-sync/providers/DataSyncProvider";
import { withSync } from "@/modules/data-sync/ui/SyncedComponent";
import moment from "moment";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageLayout from "../components/layouts/PageLayout";


const TestPage = ({ entities, something }: { entities: Tag[], something: UserAccount[] }) => {
    // const logger = AppLogger.tagged('TestPage');
    // const [entities, setEntities] = useState<Tag[]>([]);
    const [syncing, setSyncing] = useState(false);
    const [newlyCreatedId, setNewlyCreatedId] = useState<string | null>(null);
    const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
    const { orchestrator, loading } = useDataSync();
    const { householdId } = useParams();

    // logger.v(`loading: ${loading}, orchestrator: ${orchestrator}`);

    // useEffect(() => {
    //     if (!loading && orchestrator != null) {
    //         logger.v('Orchestrator is ready, loading entities');
    //         let unsubscribe: (() => void) | undefined;
    //         (async () => {
    //             unsubscribe = await loadEntities();
    //         })();
    //         return () => {
    //             // ensure any subscriptions are cleaned up
    //             unsubscribe?.();
    //         };
    //     }
    // }, [loading, orchestrator]);

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

    // const loadEntities = async (): Promise<() => void> => {
    //     // orchestrator is guaranteed by the caller
    //     const repo = orchestrator!.repo(EntityName.Tag);
    //     const observable = await repo.observeAll();
    //     const sub = observable.subscribe(all => setEntities(all as Tag[]));
    //     return () => sub.unsubscribe();
    // }

    const handleDelete = async (id: string) => {
        if (!orchestrator) return;
        // mark as deleting to trigger fade-out transition
        setDeletingIds(prev => new Set(prev).add(id));
        // small delay to allow animation to play
        setTimeout(() => {
            const repo = orchestrator.repo(EntityName.Tag);
            repo.delete(id);
            // cleanup id from deleting set (in case entity list lingers)
            setDeletingIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }, 200);
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
        const id = repo.save(newEntity);
        setNewlyCreatedId(id);
        // clear highlight after a short time
        setTimeout(() => setNewlyCreatedId(null), 1000);
    };

    const handleUpdate = async (id: string) => {
        if (!orchestrator) return;
        const repo = orchestrator.repo(EntityName.Tag);
        // Simple update logic for demo, customize per entity
        const entity = entities.find(e => e.id === id);
        if (!entity) return;
        const updated = { ...entity };
        (updated as Tag).name = ((updated as Tag).name || '') + ' (edited)';
        repo.save(updated);
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

    // Keep a consistently sorted view by id
    const sortedEntities = useMemo(() => {
        return [...entities].sort((a, b) => String(a.id ?? '').localeCompare(String(b.id ?? '')));
    }, [entities]);

    const columns = useMemo(
        () => (sortedEntities.length > 0 ? Object.keys(sortedEntities[0]) : []),
        [sortedEntities]
    );

    const renderCellValue = (value: unknown) => {
        if (value == null) return '';
        // detect Date or date-like string
        const isDateLike = value instanceof Date || (typeof value === 'string' && !Number.isNaN(Date.parse(value)));
        if (isDateLike) {
            const m = moment(value as Date | string);
            const formatted = m.format('ll, LT');
            const relative = m.fromNow();
            return (
                <div className="min-w-[12rem]">
                    <div>{formatted}</div>
                    <div className="text-muted-foreground text-xs">{relative}</div>
                </div>
            );
        }
        return String(value);
    };

    return (
        <PageLayout title="Store Testing">
            <h2>Store Testing</h2> User Account count = {something.length}
            {(loading || !orchestrator) && <Spinner />}
            {/* <InitializeDriveComp> */}
            {!loading && <div style={{ marginTop: 24 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                    <Button onClick={handleCreate}>Create New</Button>
                    <Button disabled={syncing} onClick={syncNow} className={syncing ? 'animate-pulse' : ''}>
                        {syncing ? 'Syncing…' : 'Sync Now'}
                    </Button>
                </div>
                <div style={{ marginTop: 16 }}>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {columns.map(key => (
                                    <TableHead key={key}>{key}</TableHead>
                                ))}
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedEntities.map(entity => {
                                const id = entity.id as string;
                                return (
                                    <TableRow
                                        key={id}
                                        className={[
                                            newlyCreatedId === id ? 'bg-accent/20 transition-colors duration-700' : '',
                                            deletingIds.has(id) ? 'opacity-0 -translate-y-1 transition-all duration-200' : 'transition-all duration-200'
                                        ].join(' ')}
                                    >
                                        {columns.map(key => (
                                            <TableCell key={key}>
                                                <Link to={`/${householdId}/test/${id}`}>
                                                    {renderCellValue((entity as any)[key])}
                                                </Link>
                                            </TableCell>
                                        ))}
                                        <TableCell>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <Button onClick={() => handleUpdate(id)}>
                                                    Edit
                                                </Button>
                                                <Button variant="destructive" onClick={() => handleDelete(id)}>
                                                    Delete
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>}
            {/* </InitializeDriveComp> */}
        </PageLayout>
    );
}


const synced = withSync(
    (orchestrator) => {
        const repo = orchestrator.repo(EntityName.Tag);
        const entities = repo.observeAll();
        const something = orchestrator.repo(EntityName.UserAccount).observeAll();
        return { entities, something };
    },
    TestPage
);

export default synced;
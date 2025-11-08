import { useApp } from "@/modules/app-ui/providers/AppProvider";
import { Sheet, SheetContent } from "@/modules/base-ui/components/ui/sheet";
import type { Entity } from "@/modules/data-sync/entities/Entity";
import { useDataSync } from "@/modules/data-sync/providers/DataSyncProvider";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import DetailsView from "./DetailsView";
import EntityList from "./EntityList";
import JsonView from "./JsonView";
import TableView from "./TableView";

const DevStorePage: React.FC = () => {
    const { orchestrator } = useDataSync();
    const { entityName, entityId } = useParams();
    const { isMobile } = useApp();
    const [rows, setRows] = useState<Entity[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [entity, setEntity] = useState<Entity | null>(null);
    const filteredRows = useMemo(() => {
        if (!searchTerm.trim()) return rows;
        const q = searchTerm.toLowerCase();
        return rows.filter(r => Object.values(r).some(v => (v + '').toLowerCase().includes(q)));
    }, [rows, searchTerm]);

    useEffect(() => {
        if (!orchestrator || !entityName) { setRows([]); return; }
        setLoading(true);
        const repo = orchestrator.repo(entityName as never);
        repo.getAll().then(list => setRows(list as Entity[])).catch(() => undefined).finally(() => setLoading(false));
        const sub = repo.observeAll().subscribe(list => setRows(list as Entity[]));
        return () => sub.unsubscribe();
    }, [orchestrator, entityName]);

    useEffect(() => {
        if (!orchestrator || !entityName || !entityId) { setEntity(null); return; }
        const repo = orchestrator.repo(entityName as never);
        repo.get(entityId).then(e => setEntity(e)).catch(() => setEntity(null));
        const sub = repo.observe(entityId).subscribe(e => setEntity(e));
        return () => sub.unsubscribe();
    }, [orchestrator, entityName, entityId]);

    if (!orchestrator) {
        return (
            <div className="flex flex-col w-full h-full items-center">
                <h1 className="text-2xl font-bold mt-10">Store Page</h1>
                <p className="mt-4 text-center text-muted-foreground">
                    Data Sync is not configured. Please set up Data Sync to access store features.
                </p>
            </div>
        );
    }

    if (isMobile) {
        if (entityName) {
            return <div className="flex flex-col h-full flex-1 overflow-clip">
                <DetailsView rows={rows} setSearchTerm={setSearchTerm} />
                <div className="w-full h-full overflow-auto">
                    <TableView rows={filteredRows} loading={loading} />
                </div>
                {entity && <Sheet open={true}>
                    <SheetContent side="bottom">
                        <JsonView entity={entity} />
                    </SheetContent>
                </Sheet>}
            </div>;
        }

        return <div className="">
            <EntityList />
        </div>;
    }

    return (
        <div className="grow flex flex-row gap-2 mt-4 p-2 w-full h-[calc(100%-3rem)] overflow-clip">
            <div className="border p-2 rounded-lg">
                <EntityList />
            </div>
            {entityName &&
                <div className="flex flex-col border rounded-lg h-full flex-1 overflow-hidden">
                    <DetailsView rows={rows} setSearchTerm={setSearchTerm} />
                    <div className="w-full h-full overflow-auto">
                        <TableView rows={filteredRows} loading={loading} />
                    </div>
                </div>}
            {entity &&
                <div className="min-w-1/4 max-w-1/3 h-full border rounded-lg overflow-auto">
                    <JsonView entity={entity} />
                </div>}
        </div>
    );
};

export default DevStorePage;
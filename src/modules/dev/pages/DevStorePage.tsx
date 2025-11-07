import { Card, CardContent } from "@/modules/base-ui/components/ui/card";
import { Input } from "@/modules/base-ui/components/ui/input";
import { Sheet, SheetContent } from "@/modules/base-ui/components/ui/sheet";
import { Sidebar, SidebarContent, SidebarHeader, SidebarInput, SidebarInset, SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarSeparator, SidebarTrigger } from "@/modules/base-ui/components/ui/sidebar";
import { useDataSync } from "@/modules/data-sync/providers/DataSyncProvider";
import { EntityTable } from "@/modules/dev/components/EntityTable";
import { useDevEntityList } from "@/modules/dev/hooks/useDevEntityList";
import { useDevEntityNames } from "@/modules/dev/hooks/useDevEntityNames";
import { useMemo, useState } from "react";

const DevStorePage: React.FC = () => {
    const { orchestrator } = useDataSync();
    const entityNames = useDevEntityNames();
    const [entityQuery, setEntityQuery] = useState("");
    const filteredNames = useMemo(() => {
        if (!entityQuery.trim()) return entityNames;
        const q = entityQuery.toLowerCase();
        return entityNames.filter(n => n.toLowerCase().includes(q));
    }, [entityNames, entityQuery]);
    const [selectedEntityName, setSelectedEntityName] = useState<string | null>(null);
    const { rows, totalSize } = useDevEntityList(selectedEntityName || undefined);
    const [rowQuery, setRowQuery] = useState("");
    const filteredRows = useMemo(() => {
        if (!rowQuery.trim()) return rows;
        const q = rowQuery.toLowerCase();
        return rows.filter(r => r.label.toLowerCase().includes(q) || r.id.toLowerCase().includes(q));
    }, [rowQuery, rows]);
    const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
    const selectedRow = filteredRows.find(r => r.id === selectedRowId) || null;

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

    return (
        <SidebarProvider className="h-full">
            <Sidebar side="left" collapsible="offcanvas" variant="floating">
                <SidebarHeader>
                    <SidebarInput
                        placeholder="Filter entities"
                        value={entityQuery}
                        onChange={(e) => setEntityQuery(e.target.value)}
                    />
                    <SidebarSeparator />
                </SidebarHeader>
                <SidebarContent>
                    <SidebarMenu>
                        {filteredNames.map(name => (
                            <SidebarMenuItem key={name}>
                                <SidebarMenuButton
                                    isActive={name === selectedEntityName}
                                    onClick={() => { setSelectedEntityName(name); setSelectedRowId(null); }}
                                    tooltip={name}
                                >
                                    <span>{name}</span>
                                </SidebarMenuButton>
                                <SidebarMenuBadge>{/* count placeholder */}</SidebarMenuBadge>
                            </SidebarMenuItem>
                        ))}
                        {filteredNames.length === 0 && <div className="text-xs px-2 py-1 text-muted-foreground">No entities</div>}
                    </SidebarMenu>
                </SidebarContent>
            </Sidebar>
            <SidebarInset>
                <div className="p-4 flex flex-col gap-4 h-full">
                    <Card className="py-3">
                        <CardContent className="py-0 flex flex-wrap gap-3 items-end justify-between">
                            <div>
                                <h1 className="text-lg font-semibold">Data Explorer</h1>
                                <p className="text-xs text-muted-foreground">
                                    {selectedEntityName || 'Select entity'} · {rows.length} rows · {(totalSize / 1024).toFixed(1)} KB
                                </p>
                            </div>
                            <div className="flex gap-2 items-center w-full sm:w-auto">
                                <Input
                                    placeholder="Filter rows"
                                    value={rowQuery}
                                    onChange={(e) => { setRowQuery(e.target.value); setSelectedRowId(null); }}
                                    className="sm:w-56"
                                />
                                <SidebarTrigger className="sm:hidden" />
                            </div>
                        </CardContent>
                    </Card>
                    <div className="grid xl:grid-cols-[1fr_380px] gap-4 flex-1 min-h-0">
                        <Card className="py-2 flex flex-col min-h-0">
                            <CardContent className="py-0 flex-1 flex flex-col min-h-0">
                                {selectedEntityName ? (
                                    <EntityTable
                                        rows={filteredRows}
                                        selectedId={selectedRowId}
                                        onSelect={(r) => setSelectedRowId(r.id)}
                                        height={selectedRow ? 300 : undefined}
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Select an entity type...</div>
                                )}
                            </CardContent>
                        </Card>
                        <Card className="py-2 hidden xl:flex flex-col min-h-0">
                            <CardContent className="py-0 flex-1 flex flex-col min-h-0">
                                {selectedRow ? (
                                    <pre className="text-[11px] overflow-auto flex-1 bg-background p-2 rounded border">
                                        {JSON.stringify(selectedRow.raw, null, 2)}
                                    </pre>
                                ) : (
                                    <div className="text-xs text-muted-foreground h-full flex items-center justify-center">Row not selected</div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
                {/* Mobile/Tablet Detail Sheet */}
                <Sheet open={!!selectedRow && window.innerWidth < 1280} onOpenChange={(open) => { if (!open) setSelectedRowId(null); }}>
                    <SheetContent side="bottom">
                        <div className="p-2 flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <h2 className="font-semibold text-sm truncate" title={selectedRow?.label}>{selectedEntityName} Detail</h2>
                            </div>
                            <div className="overflow-auto max-h-[60vh]">
                                <pre className="text-[11px] bg-background p-2 rounded border">
                                    {selectedRow ? JSON.stringify(selectedRow.raw, null, 2) : ''}
                                </pre>
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            </SidebarInset>
        </SidebarProvider>
    );
};

export default DevStorePage;
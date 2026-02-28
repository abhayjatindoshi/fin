import { Button } from "@/modules/base-ui/components/ui/button";
import { Card, CardContent } from "@/modules/base-ui/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/modules/base-ui/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/modules/base-ui/components/ui/dropdown-menu";
import { Spinner } from "@/modules/base-ui/components/ui/spinner";
import { FolderOpen, Home, MoreHorizontal, Pencil, Plus, Star, Unlink } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Tenant } from "../entities/Tenant";
import type { EntityUtil } from "../EntityUtil";
import type { SchemaMap } from "../interfaces/types";
import { useTenant } from "../providers/TenantProvider";
import TenantStepDialog from "./TenantStepDialog";

const DefaultTenantIcon = () => <Home className="h-10 w-10" />;

export interface TenantProps<T extends Tenant> {
    tenantStr?: string;
    TenantIcon?: React.ComponentType<{ tenant: T }>;
    onSelect: (tenant: T) => Promise<void>;
    onEdit?: (tenant: T) => void;
    autoSelectDefault?: boolean;
}

const TenantSelectionComponent = <U extends EntityUtil<SchemaMap>, FilterOptions, T extends Tenant>({
    tenantStr = 'tenant',
    TenantIcon = DefaultTenantIcon as React.ComponentType<{ tenant: T }>,
    onSelect,
    onEdit,
    autoSelectDefault = true,
}: TenantProps<T>) => {

    const { manager, setCurrentTenant, loading } = useTenant<U, FilterOptions, T>();
    const [newDialogOpen, setNewDialogOpen] = useState(false);
    const [openDialogOpen, setOpenDialogOpen] = useState(false);
    const [tenants, setTenants] = useState<T[] | null>(null);
    const [selectingId, setSelectingId] = useState<string | null>(null);
    const [unlinkTarget, setUnlinkTarget] = useState<T | null>(null);
    const [unlinking, setUnlinking] = useState(false);
    const [defaultTenantId, setDefaultTenantId] = useState<string | null>(null);

    const settings = useMemo(() => manager?.combinedSettings() || null, [manager]);
    const lowerTenantStr = tenantStr.toLowerCase();
    const capitalizedTenantStr = tenantStr.charAt(0).toUpperCase() + tenantStr.slice(1).toLowerCase();

    useEffect(() => {
        if (!manager) return;
        const subscription = manager.observeAll().subscribe(setTenants);
        return () => subscription.unsubscribe();
    }, [manager]);

    useEffect(() => {
        if (!manager) return;
        const subscription = manager.observeDefaultTenantId().subscribe(setDefaultTenantId);
        return () => subscription.unsubscribe();
    }, [manager]);

    // Auto-select default tenant on first load
    const autoSelectedRef = useRef(false);
    useEffect(() => {
        if (!autoSelectDefault || autoSelectedRef.current || !tenants || tenants.length === 0 || !defaultTenantId) return;
        const defaultTenant = tenants.find(t => t.id === defaultTenantId);
        if (!defaultTenant) return;
        autoSelectedRef.current = true;
        selectTenant(defaultTenant);
    }, [tenants, defaultTenantId]);

    const getTenantLocation = (tenant: T): string | null => {
        const t = tenant as T & { folderName?: string };
        return t.folderName ?? null;
    };

    const selectTenant = async (tenant: T) => {
        if (!tenant.id) return;
        setSelectingId(tenant.id);
        try {
            setCurrentTenant(tenant);
            await onSelect(tenant);
        } finally {
            setSelectingId(null);
        }
    };

    const handleUnlink = async () => {
        if (!manager || !unlinkTarget?.id) return;
        setUnlinking(true);
        try {
            await manager.unlinkTenant(unlinkTarget.id);
        } finally {
            setUnlinking(false);
            setUnlinkTarget(null);
        }
    };

    return (
        <div className="flex flex-col gap-4 w-full max-w-2xl p-4 h-full overflow-y-auto">
            {loading || settings == null || tenants == null ? (
                <div className="flex justify-center py-12">
                    <Spinner />
                </div>
            ) : (
                <>
                    {/* Cards grid — includes add/open action cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {tenants.map(t => (
                            <Card
                                key={t.id}
                                className="relative group cursor-pointer hover:border-primary hover:bg-muted transition-colors"
                                onClick={() => selectTenant(t)}
                            >
                                <CardContent className="flex flex-col items-center gap-2 p-3">
                                    {/* Icon / spinner */}
                                    <div className="flex items-center justify-center h-20 w-20 rounded-full bg-background border border-border text-foreground">
                                        {selectingId === t.id
                                            ? <Spinner className="h-10 w-10" />
                                            : <TenantIcon tenant={t} />
                                        }
                                    </div>

                                    {/* Name */}
                                    <p className="text-sm font-semibold text-center leading-tight truncate w-full">
                                        {t.name}
                                    </p>

                                    {/* Subtitle */}
                                    {getTenantLocation(t) && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground truncate w-full justify-center">
                                            <FolderOpen className="h-3 w-3 shrink-0" />
                                            <span className="truncate">{getTenantLocation(t)}</span>
                                        </div>
                                    )}
                                </CardContent>

                                {/* Default star badge */}
                                {defaultTenantId === t.id && (
                                    <div className="absolute top-2 left-2 text-yellow-400">
                                        <Star className="h-4 w-4 fill-current" />
                                    </div>
                                )}

                                {/* ⋯ menu */}
                                <div
                                    className="absolute top-2 right-2"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                                            >
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            {onEdit && (
                                                <>
                                                    <DropdownMenuItem onClick={() => onEdit(t)}>
                                                        <Pencil className="h-4 w-4 mr-2" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                </>
                                            )}
                                            {defaultTenantId === t.id ? (
                                                <DropdownMenuItem onClick={() => manager?.setDefaultTenantId(null)}>
                                                    <Star className="h-4 w-4 mr-2" />
                                                    Remove default
                                                </DropdownMenuItem>
                                            ) : (
                                                <DropdownMenuItem onClick={() => manager?.setDefaultTenantId(t.id ?? null)}>
                                                    <Star className="h-4 w-4 mr-2" />
                                                    Set as default
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-destructive focus:text-destructive"
                                                onClick={() => setUnlinkTarget(t)}
                                            >
                                                <Unlink className="h-4 w-4 mr-2" />
                                                Unlink
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </Card>
                        ))}

                        {/* New card */}
                        {settings.newForm && settings.newForm.steps.length > 0 && (
                            <Card
                                className="relative cursor-pointer hover:border-primary hover:bg-muted transition-colors"
                                onClick={() => setNewDialogOpen(true)}
                            >
                                <CardContent className="flex flex-col items-center justify-center gap-2 p-3 h-full min-h-[130px]">
                                    <div className="flex items-center justify-center h-20 w-20 rounded-full bg-background border border-border text-foreground">
                                        <Plus className="h-10 w-10" />
                                    </div>
                                    <p className="text-sm font-semibold text-center text-muted-foreground">
                                        New {capitalizedTenantStr}
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Open card */}
                        {settings.openForm && settings.openForm.steps.length > 0 && (
                            <Card
                                className="relative cursor-pointer hover:border-primary hover:bg-muted transition-colors"
                                onClick={() => setOpenDialogOpen(true)}
                            >
                                <CardContent className="flex flex-col items-center justify-center gap-2 p-3 h-full min-h-[130px]">
                                    <div className="flex items-center justify-center h-20 w-20 rounded-full bg-background border border-border text-foreground">
                                        <FolderOpen className="h-10 w-10" />
                                    </div>
                                    <p className="text-sm font-semibold text-center text-muted-foreground">
                                        Open {capitalizedTenantStr}
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </>
            )}

            {settings && settings.newForm && settings.newForm.steps.length > 0 &&
                <TenantStepDialog<T>
                    open={newDialogOpen}
                    onOpenChange={setNewDialogOpen}
                    fallbackTitle={`New ${capitalizedTenantStr}`}
                    fallbackDescription={`Create a new ${lowerTenantStr}.`}
                    settings={settings.newForm}
                    opName="Create"
                    opNameVerb="Creating…"
                    op={async (tenant: Partial<T>) => {
                        if (!manager) return;
                        await manager.createTenant(tenant);
                        setNewDialogOpen(false);
                    }}
                />
            }

            {settings && settings.openForm && settings.openForm.steps.length > 0 &&
                <TenantStepDialog<T>
                    open={openDialogOpen}
                    onOpenChange={setOpenDialogOpen}
                    fallbackTitle={`Open ${capitalizedTenantStr}`}
                    fallbackDescription={`Open an existing ${lowerTenantStr}.`}
                    settings={settings.openForm}
                    opName="Open"
                    opNameVerb="Opening…"
                    op={async (tenant: Partial<T>) => {
                        if (!manager) return;
                        await manager.createTenant(tenant);
                        setOpenDialogOpen(false);
                    }}
                />
            }

            <Dialog open={!!unlinkTarget} onOpenChange={(open) => { if (!open) setUnlinkTarget(null); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Unlink {capitalizedTenantStr}</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to unlink <strong>{unlinkTarget?.name}</strong>? This will remove it from your {lowerTenantStr} list. The data will not be deleted.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setUnlinkTarget(null)} disabled={unlinking}>Cancel</Button>
                        <Button variant="destructive" onClick={handleUnlink} disabled={unlinking}>
                            {unlinking ? <Spinner className="mr-2 h-4 w-4" /> : null}
                            Unlink
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default TenantSelectionComponent;
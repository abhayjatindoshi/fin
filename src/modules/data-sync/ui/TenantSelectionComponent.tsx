import EmptyOpenBox from "@/modules/app-ui/svg/EmptyOpenBox";
import { Button } from "@/modules/base-ui/components/ui/button";
import { Spinner } from "@/modules/base-ui/components/ui/spinner";
import { ChevronRight, FolderOpen, Home, Plus } from "lucide-react";
import { useState } from "react";
import type { Tenant } from "../entities/Tenant";
import type { EntityUtil } from "../EntityUtil";
import type { SchemaMap } from "../interfaces/types";
import { useTenant } from "../providers/TenantProvider";
import TenantStepDialog from "./TenantStepDialog";

export interface TenantProps<T extends Tenant> {
    tenantStr?: string;
    onSelect: (tenant: T) => void;
}

export interface TenantDialogProps {
    lowerTenantStr: string;
    capitalizedTenantStr: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const TenantSelectionComponent = <U extends EntityUtil<SchemaMap>, FilterOptions, T extends Tenant>({ tenantStr = 'tenant', onSelect }: TenantProps<T>) => {

    const { manager, tenants, setCurrentTenant, loading, settings } = useTenant<U, FilterOptions, T>();
    const [newDialogOpen, setNewDialogOpen] = useState(false);
    const [openDialogOpen, setOpenDialogOpen] = useState(false);

    const lowerTenantStr = tenantStr.toLowerCase();
    const capitalizedTenantStr = tenantStr.charAt(0).toUpperCase() + tenantStr.slice(1).toLowerCase();

    const selectTenant = (tenant: T) => {
        setCurrentTenant(tenant);
        onSelect(tenant);
    };

    return (
        <div className="flex flex-col gap-2 items-center w-full max-w-[400px] p-2">
            {loading ?
                <Spinner /> :
                <>
                    <div className="flex flex-row gap-5 mb-5 w-full">
                        {settings.newForm && settings.newForm.steps.length > 0 && <Button className="flex-1" onClick={() => setNewDialogOpen(true)}><Plus /> New</Button>}
                        {settings.openForm && settings.openForm.steps.length > 0 && <Button className="flex-1" onClick={() => setOpenDialogOpen(true)}><FolderOpen /> Open</Button>}
                    </div>
                    {tenants.length === 0 ?
                        <div className="flex flex-col gap-2 items-center">
                            <EmptyOpenBox animated={false} tone="accent" />
                            <p className="text-muted-foreground">No {lowerTenantStr} found.</p>
                        </div> :
                        <div className="w-full">
                            {tenants.map(t => (
                                <Button key={t.id} variant="outline" className="w-full h-16 m-1" onClick={() => selectTenant(t)}>
                                    <div className="flex flex-row gap-1 p-1 w-full items-center cursor-pointer">
                                        <Home />
                                        <div className="flex flex-row justify-start items-center gap-2 px-3 py-1 flex-1">
                                            <div className="text-lg font-medium truncate">{t.name}</div>
                                        </div>
                                        <ChevronRight />
                                    </div>
                                </Button>
                            ))}
                        </div>
                    }
                </>
            }

            {settings.newForm && settings.newForm.steps.length > 0 &&
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

            {settings.openForm && settings.openForm.steps.length > 0 &&
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
        </div>
    )
}

export default TenantSelectionComponent;
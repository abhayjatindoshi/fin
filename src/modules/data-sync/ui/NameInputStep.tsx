import { Input } from "@/modules/base-ui/components/ui/input";
import { Label } from "@/modules/base-ui/components/ui/label";
import { useEffect, useState } from "react";
import type { Tenant } from "../entities/Tenant";
import type { EntityUtil } from "../EntityUtil";
import type { TenantFormProps } from "../interfaces/IPersistence";
import type { SchemaMap } from "../interfaces/types";
import { useTenant } from "../providers/TenantProvider";

const NameInputStep = <U extends EntityUtil<SchemaMap>, FilterOptions, T extends Tenant>({ tenant, setTenant, validateRef }: TenantFormProps<T>) => {

    const { settings } = useTenant<U, FilterOptions, T>();
    const [nameError, setNameError] = useState<string | undefined>(undefined);

    useEffect(() => {
        validateRef.current.validate = async () => {
            const isNameValid = !!tenant.name && tenant.name.trim().length > 0;
            setNameError(isNameValid ? undefined : 'Name is required');
            return isNameValid;
        }
    }, [tenant, validateRef]);

    return (
        <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
                value={tenant.name}
                onChange={(e) => setTenant({ ...tenant, name: e.target.value })}
                placeholder={settings.newForm?.namePlaceholder || `Enter name...`}
                aria-invalid={!!nameError} />
            {nameError && <p className="text-sm text-destructive">{nameError}</p>}
        </div>
    );
};

export default NameInputStep;
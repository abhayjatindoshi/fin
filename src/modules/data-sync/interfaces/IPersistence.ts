import type { ComponentType, RefObject } from "react";
import type { Tenant } from "../entities/Tenant";
import type { EntityKeyData } from "./types";

export type TenantFormValidateRef = {
    validate: () => Promise<boolean>;
}

export type TenantFormProps<T> = {
    tenant: Partial<T>;
    setTenant: (tenant: Partial<T>) => void;
    validateRef: RefObject<TenantFormValidateRef>;
}

export type TenantFormStep<T extends Tenant> = {
    name?: string;
    component: ComponentType<TenantFormProps<T>>;
    enabled?: (tenant: Partial<T>) => boolean;
}

export type TenantFormSettings<T extends Tenant> = {
    title?: string;
    description?: string;
    steps: Array<TenantFormStep<T>>;
}

export type TenantSettings<T extends Tenant> = {
    newForm?: TenantFormSettings<T>
    openForm?: TenantFormSettings<T>;
}

export interface IPersistence<T extends Tenant> {
    tenantSettings?: TenantSettings<T>;
    loadData(tenant: T | null, key: string): Promise<EntityKeyData | null>;
    storeData(tenant: T | null, key: string, data: EntityKeyData): Promise<void>;
    clearData(tenant: T | null, key: string): Promise<void>;
}
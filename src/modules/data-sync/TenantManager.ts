import { nanoid } from "nanoid";
import type { Tenant } from "./entities/Tenant";
import type { EntityUtil } from "./EntityUtil";
import type { TenantSettings } from "./interfaces/IPersistence";
import type { EntityKeyData, InputArgs, SchemaMap } from "./interfaces/types";

export type TenantManagerConfig<U extends EntityUtil<SchemaMap>, FilterOptions, T extends Tenant> = Omit<InputArgs<U, FilterOptions, T>, "tenant">;

export class TenantManager<U extends EntityUtil<SchemaMap>, FilterOptions, T extends Tenant> {

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private static instance: TenantManager<any, any, any> | null = null;

    public static getInstance<U extends EntityUtil<SchemaMap>, FilterOptions, T extends Tenant>(): TenantManager<U, FilterOptions, T> {
        if (!TenantManager.instance) {
            throw new Error("TenantManager is not loaded");
        }
        return TenantManager.instance as TenantManager<U, FilterOptions, T>;
    }

    public static load<U extends EntityUtil<SchemaMap>, FilterOptions, T extends Tenant>(config: TenantManagerConfig<U, FilterOptions, T>): TenantManager<U, FilterOptions, T> {
        const instance = new TenantManager<U, FilterOptions, T>(config);
        TenantManager.instance = instance;
        return instance;
    }

    private static tenantKey = 'tenants';
    private static tenantEntityName = "Tenant";
    private config: TenantManagerConfig<U, FilterOptions, T>;
    private tenants: T[] | null = null;

    private constructor(config: TenantManagerConfig<U, FilterOptions, T>) {
        this.config = config;
    }

    async getTenants(): Promise<T[]> {
        if (this.tenants) return this.tenants;

        const data = await this.config.cloud?.loadData(null, TenantManager.tenantKey) ??
            await this.config.local.loadData(null, TenantManager.tenantKey);
        if (!data) {
            this.tenants = [];
            return [];
        }
        this.tenants = this.fromEntityKeyData(data);
        return this.tenants;
    }

    async createTenant(tenant: Partial<T>): Promise<T> {
        if (!tenant.id) tenant.id = nanoid(5);
        tenant = { ...tenant, ...this.config.util.parse(TenantManager.tenantEntityName, tenant) };
        tenant.createdAt = new Date();
        tenant.updatedAt = new Date();
        tenant.version = 1;

        await this.ensureTenants();
        this.tenants!.push(tenant as T);

        const data = this.toEntityKeyData(this.tenants!);
        await this.config.cloud?.storeData(null, TenantManager.tenantKey, data);
        await this.config.local.storeData(null, TenantManager.tenantKey, data);

        return tenant as T;
    }

    combinedSettings(): TenantSettings<T> {
        const store = this.config.store.tenantSettings;
        const local = this.config.local.tenantSettings;
        const cloud = this.config.cloud?.tenantSettings;

        let combined: TenantSettings<T> = {};
        if (store) combined = { ...store };
        if (local) combined = { ...combined, ...local };
        if (cloud) combined = { ...combined, ...cloud };
        console.log("Combined Tenant Settings:", combined);
        return combined;
    }

    private fromEntityKeyData(data: EntityKeyData): T[] {
        if (!data || !data.Tenant) return [];
        return Object.values(data.Tenant) as T[];
    }

    private toEntityKeyData(tenants: T[]): EntityKeyData {
        return {
            Tenant: tenants.reduce((obj, tenant) => {
                obj[tenant.id!] = tenant;
                return obj;
            }, {} as Record<string, T>)
        };
    }

    private async ensureTenants(): Promise<void> {
        if (!this.tenants) await this.getTenants();
    }
}
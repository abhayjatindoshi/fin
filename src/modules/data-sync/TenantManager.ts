import { nanoid } from "nanoid";
import { BehaviorSubject, Observable } from "rxjs";
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
    private tenants: Record<string, T> | null = null;
    private tenantsSubject = new BehaviorSubject<T[] | null>(null);
    private tenantSubjectMap: Record<string, BehaviorSubject<T | null>> = {};

    private localLoad: Promise<void> | null = null;
    private cloudLoad: Promise<void> | null = null;

    private constructor(config: TenantManagerConfig<U, FilterOptions, T>) {
        this.config = config;
        this.localLoad = this.config.local.loadData(null, TenantManager.tenantKey)
            .then(data => this.fromEntityKeyData(data))
            .then(this.updateTenantData.bind(this))

        this.cloudLoad = this.config.cloud?.loadData(null, TenantManager.tenantKey)
            .then(data => this.fromEntityKeyData(data))
            .then(this.updateTenantData.bind(this)) ?? Promise.resolve();
    }

    async getAll(): Promise<T[]> {
        if (this.tenants) return Object.values(this.tenants);
        await Promise.all([this.localLoad, this.cloudLoad]);
        return Object.values(this.tenants ?? {});
    }

    async get(id: string): Promise<T | null> {
        if (this.tenants && this.tenants[id]) return this.tenants[id];
        await Promise.allSettled([this.localLoad, this.cloudLoad]);
        return this.tenants ? this.tenants[id] ?? null : null;
    }

    observeAll(): Observable<T[] | null> {
        return new Observable<T[] | null>(subscriber => {
            const subscription = this.tenantsSubject.subscribe(subscriber);
            return () => subscription.unsubscribe();
        });
    }

    observe(id: string): Observable<T | null> {
        if (!this.tenantSubjectMap[id]) {
            const tenant = this.tenants ? this.tenants[id] ?? null : null;
            this.tenantSubjectMap[id] = new BehaviorSubject<T | null>(tenant);
        }

        return new Observable<T | null>(subscriber => {
            const subscription = this.tenantSubjectMap[id].subscribe(subscriber);
            return () => {
                subscription.unsubscribe();
                if (!this.tenantSubjectMap[id].observed) {
                    this.tenantSubjectMap[id].complete();
                    delete this.tenantSubjectMap[id];
                }
            };
        });
    }

    async createTenant(tenant: Partial<T>): Promise<T> {
        await this.getAll();
        if (!this.tenants) this.tenants = {};

        const tenantRecord = {
            ...tenant,
            ...this.config.util.parse(TenantManager.tenantEntityName, tenant),
            id: nanoid(5),
            createdAt: new Date(),
            updatedAt: new Date(),
            version: 1
        } as T;

        this.tenants[tenantRecord.id!] = tenantRecord;
        this.notifyUpdate(tenantRecord);
        await this.save();
        return tenantRecord;
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

    getDataSyncConfig(tenant: T): InputArgs<U, FilterOptions, T> {
        return { ...this.config, tenant };
    }

    private notifyUpdate(tenant: T | null): void {
        if (tenant && this.tenantSubjectMap[tenant.id!]) {
            this.tenantSubjectMap[tenant.id!].next(tenant);
        }
        this.tenantsSubject.next(this.tenants ? Object.values(this.tenants) : null);
    }

    private updateTenantData(tenants: T[]): void {
        if (!this.tenants) this.tenants = {};
        tenants.forEach(t => {
            if (!this.tenants || !t.id) return;
            if (!this.tenants[t.id] || new Date(t.updatedAt) > new Date(this.tenants[t.id].updatedAt)) {
                this.tenants[t.id] = t;
                this.notifyUpdate(t);
            }
        });
        this.notifyUpdate(null);
    }

    private fromEntityKeyData(data: EntityKeyData | null): T[] {
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

    private async save(): Promise<void> {
        if (!this.tenants) return;
        const tenantsArray = Object.values(this.tenants);
        const data = this.toEntityKeyData(tenantsArray);
        await Promise.all([
            this.config.local.storeData(null, TenantManager.tenantKey, data),
            this.config.cloud?.storeData(null, TenantManager.tenantKey, data) ?? Promise.resolve()
        ]);
    }
}
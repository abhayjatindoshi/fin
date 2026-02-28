import { nanoid } from "nanoid";
import { BehaviorSubject, Observable, map } from "rxjs";
import { toRecord } from "../app-ui/common/ComponentUtils";
import type { Tenant } from "./entities/Tenant";
import type { EntityUtil } from "./EntityUtil";
import type { TenantSettings } from "./interfaces/IPersistence";
import type { EntityKeyData, InputArgs, SchemaMap } from "./interfaces/types";

export type TenantManagerConfig<U extends EntityUtil<SchemaMap>, FilterOptions, T extends Tenant> = Omit<InputArgs<U, FilterOptions, T>, "tenant">;

export class TenantManager<U extends EntityUtil<SchemaMap>, FilterOptions, T extends Tenant> {

    public static load<U extends EntityUtil<SchemaMap>, FilterOptions, T extends Tenant>(config: TenantManagerConfig<U, FilterOptions, T>): TenantManager<U, FilterOptions, T> {
        return new TenantManager<U, FilterOptions, T>(config);
    }

    private static tenantKey = 'tenants';
    private static tenantEntityName = "Tenant";
    private config: TenantManagerConfig<U, FilterOptions, T>;
    private tenants: Record<string, T> | null = null;
    private tenantsSubject = new BehaviorSubject<T[] | null>(null);
    private loadingSubject = new BehaviorSubject<boolean>(true);

    private localLoad: Promise<void> | null = null;
    private cloudLoad: Promise<void> | null = null;

    private constructor(config: TenantManagerConfig<U, FilterOptions, T>) {
        this.config = config;
        this.localLoad = this.config.local.loadData(null, TenantManager.tenantKey)
            .then(data => this.fromEntityKeyData(data))
            .then(this.updateTenantData.bind(this));

        this.cloudLoad = this.config.cloud?.loadData(null, TenantManager.tenantKey)
            .then(data => this.fromEntityKeyData(data))
            .then(this.updateTenantData.bind(this))
            .then(() => this.saveToLocal()) ?? Promise.resolve();

        Promise.allSettled([this.localLoad, this.cloudLoad])
            .finally(() => this.loadingSubject.next(false));
    }

    async getAll(): Promise<T[]> {
        await this.localLoad;
        if (this.tenants) return Object.values(this.tenants);
        await this.cloudLoad;
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

    observeLoading(): Observable<boolean> {
        return new Observable<boolean>(subscriber => {
            const subscription = this.loadingSubject.subscribe(subscriber);
            return () => subscription.unsubscribe();
        });
    }

    getDefaultTenantId(): string | null {
        if (!this.tenants) return null;
        return Object.values(this.tenants).find(t => t.isDefault)?.id ?? null;
    }

    async setDefaultTenantId(id: string | null): Promise<void> {
        await this.getAll();
        if (!this.tenants) return;
        Object.values(this.tenants).forEach(t => {
            this.tenants![t.id!] = { ...t, isDefault: t.id === id ? true : undefined };
        });
        this.notifyUpdate();
        await this.save();
    }

    observeDefaultTenantId(): Observable<string | null> {
        return this.tenantsSubject.pipe(
            map(tenants => tenants?.find(t => t.isDefault)?.id ?? null)
        );
    }

    async unlinkTenant(id: string): Promise<void> {
        await this.getAll();
        if (!this.tenants || !this.tenants[id]) return;
        delete this.tenants[id];
        this.notifyUpdate();
        await this.save();
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
        this.notifyUpdate();
        await this.save();
        return tenantRecord;
    }

    async updateTenant(id: string, updates: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'version'>>): Promise<T | null> {
        await this.getAll();
        if (!this.tenants || !this.tenants[id]) return null;

        const existing = this.tenants[id];
        const merged = { ...existing, ...updates };
        const updated = {
            ...merged,
            ...this.config.util.parse(TenantManager.tenantEntityName, merged),
            id: existing.id,
            createdAt: existing.createdAt,
            updatedAt: new Date(),
            version: (existing.version ?? 1) + 1
        } as T;

        this.tenants[id] = updated;
        this.notifyUpdate();
        await this.save();
        return updated;
    }

    combinedSettings(): TenantSettings<T> {
        const store = this.config.store.tenantSettings;
        const local = this.config.local.tenantSettings;
        const cloud = this.config.cloud?.tenantSettings;

        let combined: TenantSettings<T> = {};
        if (store) combined = { ...store };
        if (local) combined = { ...combined, ...local };
        if (cloud) combined = { ...combined, ...cloud };
        return combined;
    }

    getDataSyncConfig(tenant: T): InputArgs<U, FilterOptions, T> {
        return { ...this.config, tenant };
    }

    private notifyUpdate(): void {
        this.tenantsSubject.next(this.tenants ? Object.values(this.tenants) : null);
    }

    private updateTenantData(tenants: T[]): void {
        if (!this.tenants) this.tenants = {};
        tenants.forEach(t => {
            if (!this.tenants || !t.id) return;
            if (!this.tenants[t.id] || new Date(t.updatedAt) > new Date(this.tenants[t.id].updatedAt)) {
                this.tenants[t.id] = t;
            }
        });
        this.notifyUpdate();
    }

    private fromEntityKeyData(data: EntityKeyData | null): T[] {
        if (!data || !data.Tenant) return [];
        return Object.values(data.Tenant) as T[];
    }

    private toEntityKeyData(tenants: T[]): EntityKeyData {
        return {
            Tenant: toRecord(tenants, 'id')
        };
    }

    private async saveToLocal(): Promise<void> {
        if (!this.tenants) return;
        const data = this.toEntityKeyData(Object.values(this.tenants));
        await this.config.local.storeData(null, TenantManager.tenantKey, data);
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
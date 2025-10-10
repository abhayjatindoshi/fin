import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import type { Tenant } from "../entities/Tenant"
import type { EntityUtil } from "../EntityUtil"
import type { TenantSettings } from "../interfaces/IPersistence"
import type { SchemaMap } from "../interfaces/types"
import { TenantManager, type TenantManagerConfig } from "../TenantManager"

type TenantProviderState<U extends EntityUtil<SchemaMap>, FilterOptions, T extends Tenant> = {
    load: (config: TenantManagerConfig<U, FilterOptions, T>) => void,
    tenants: T[],
    currentTenant: T | null,
    manager: TenantManager<U, FilterOptions, T> | null,
    setCurrentTenant: (tenant: T | null) => void,
    loading: boolean,
    settings: TenantSettings<T>,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TenantProviderContext = createContext<TenantProviderState<any, any, any> | null>(null);

type TenantProviderProps<U extends EntityUtil<SchemaMap>, FilterOptions, T extends Tenant> = {
    config?: TenantManagerConfig<U, FilterOptions, T>,
    children: React.ReactNode
}

export const TenantProvider = <U extends EntityUtil<SchemaMap>, FilterOptions, T extends Tenant>(
    { config, children }: TenantProviderProps<U, FilterOptions, T>) => {

    const [loading, setLoading] = useState<boolean>(false);
    const [manager, setManager] = useState<TenantManager<U, FilterOptions, T> | null>(null);
    const [tenants, setTenants] = useState<T[]>([]);
    const [settings, setSettings] = useState<TenantSettings<T>>({});
    const [currentTenant, setCurrentTenant] = useState<T | null>(null);

    const chain = useRef(Promise.resolve());

    const load = useCallback(async (config: TenantManagerConfig<U, FilterOptions, T>) => {
        chain.current = chain.current.then(async () => {
            setLoading(true);

            const manager = TenantManager.load<U, FilterOptions, T>(config);
            setManager(manager);

            const tenants = await manager.getTenants();
            setTenants(tenants);

            setSettings(manager.combinedSettings());
            setLoading(false);
        });
        return chain.current;
    }, []);

    useEffect(() => {
        if (!config) return;
        load(config);
    }, [config]);

    return (
        <TenantProviderContext.Provider value={{ load, tenants, currentTenant, manager, setCurrentTenant, loading, settings }}>
            {children}
        </TenantProviderContext.Provider>
    );
}

export const useTenant = <U extends EntityUtil<SchemaMap>, FilterOptions, T extends Tenant>(): TenantProviderState<U, FilterOptions, T> => {
    const context = useContext<TenantProviderState<U, FilterOptions, T> | null>(TenantProviderContext);
    if (!context) {
        throw new Error("useTenant must be used within a TenantProvider");
    }
    return context;
};
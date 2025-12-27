import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { DataOrchestrator } from "../DataOrchestrator";
import type { Tenant } from "../entities/Tenant";
import type { EntityUtil } from "../EntityUtil";
import type { InputArgs, SchemaMap } from "../interfaces/types";

type WindowWithOrchestrator = Window & {
    orchestrator?: DataOrchestrator<any, any, any>;
}

type DataSyncProviderState<U extends EntityUtil<SchemaMap>, FilterOptions, T extends Tenant> = {
    orchestrator: DataOrchestrator<U, FilterOptions, T> | null,
    tenant: T | null,
    load: (config: InputArgs<U, FilterOptions, T>) => Promise<void>,
    unload: () => Promise<void>,
    loading: boolean,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DataSyncProviderContext = createContext<DataSyncProviderState<any, any, any> | null>(null);

export const DataSyncProvider = <U extends EntityUtil<SchemaMap>, FilterOptions, T extends Tenant>({
    children }: { children: React.ReactNode }) => {

    const [loading, setLoading] = useState<boolean>(false);
    const [orchestrator, setOrchestrator] = useState<DataOrchestrator<U, FilterOptions, T> | null>(null);

    const chain = useRef(Promise.resolve());

    useEffect(() => {
        if (!orchestrator) {
            (window as WindowWithOrchestrator).orchestrator = undefined;
        } else {
            (window as WindowWithOrchestrator).orchestrator = orchestrator;
        }
    }, [orchestrator]);

    const load = useCallback(async (config: InputArgs<U, FilterOptions, T>) => {
        setLoading(true);
        chain.current = chain.current.then(async () => {
            if (orchestrator) {
                orchestrator.ctx.logger.i("DataSyncProvider", "Unloading existing orchestrator before loading new one");
                await DataOrchestrator.unload();
                setOrchestrator(null);
            }

            await DataOrchestrator.load<U, FilterOptions, T>(config);
            const instance = DataOrchestrator.getInstance<U, FilterOptions, T>();
            instance.ctx.logger.i("DataSyncProvider", "Loaded DataOrchestrator");
            setOrchestrator(instance);
        }).finally(() => setLoading(false));

        return chain.current;
    }, []);

    const unload = useCallback(async () => {
        setLoading(true);
        chain.current = chain.current.then(async () => {
            if (!orchestrator) return;
            orchestrator.ctx.logger.i("DataSyncProvider", "Unloading DataOrchestrator");
            await DataOrchestrator.unload();
            setOrchestrator(null);
        }).finally(() => setLoading(false));
        return chain.current;
    }, [orchestrator]);

    return (
        <DataSyncProviderContext.Provider value={{ loading, tenant: orchestrator?.ctx.tenant || null, load, unload, orchestrator }}>
            {children}
        </DataSyncProviderContext.Provider>
    )
}

export const useDataSync = <U extends EntityUtil<SchemaMap>, FilterOptions, T extends Tenant>(): DataSyncProviderState<U, FilterOptions, T> => {
    const context = useContext(DataSyncProviderContext);
    if (!context) {
        throw new Error("useDataSync must be used within a DataSyncProvider");
    }
    return context as DataSyncProviderState<U, FilterOptions, T>;
}
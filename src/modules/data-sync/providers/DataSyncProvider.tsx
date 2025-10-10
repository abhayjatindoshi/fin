import { createContext, useCallback, useContext, useRef, useState } from "react";
import { DataOrchestrator } from "../DataOrchestrator";
import type { Tenant } from "../entities/Tenant";
import type { EntityUtil } from "../EntityUtil";
import type { InputArgs, SchemaMap } from "../interfaces/types";


type DataSyncProviderState<U extends EntityUtil<SchemaMap>, FilterOptions, T extends Tenant> = {
    orchestrator: DataOrchestrator<U, FilterOptions, T> | null,
    tenant: T | null,
    load: (config: InputArgs<U, FilterOptions, T>) => void,
    unload: () => void,
    loading: boolean,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DataSyncProviderContext = createContext<DataSyncProviderState<any, any, any> | null>(null);

export const DataSyncProvider = <U extends EntityUtil<SchemaMap>, FilterOptions, T extends Tenant>({
    children }: { children: React.ReactNode }) => {

    const [loading, setLoading] = useState<boolean>(false);
    const [orchestrator, setOrchestrator] = useState<DataOrchestrator<U, FilterOptions, T> | null>(null);

    const chain = useRef(Promise.resolve());

    const load = useCallback(async (config: InputArgs<U, FilterOptions, T>) => {
        chain.current = chain.current.then(async () => {
            setLoading(true);

            if (orchestrator) {
                await DataOrchestrator.unload();
                setOrchestrator(null);
            }

            await DataOrchestrator.load<U, FilterOptions, T>(config);
            setOrchestrator(DataOrchestrator.getInstance<U, FilterOptions, T>());
            setLoading(false);
        });

        return chain.current;
    }, []);

    const unload = useCallback(async () => {
        chain.current = chain.current.then(async () => {
            if (!orchestrator) return;
            setLoading(true);
            await DataOrchestrator.unload();
            setOrchestrator(null);
            setLoading(false);
        });
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
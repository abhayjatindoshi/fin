import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { DataOrchestrator } from "./DataOrchestrator"
import type { EntityUtil } from "./EntityUtil"
import type { InputArgs, SchemaMap } from "./interfaces/types"

type DataSyncProviderState<U extends EntityUtil<SchemaMap>, FilterOptions> = {
    orchestrator: DataOrchestrator<U, FilterOptions> | null,
    // config: InputArgs<U, FilterOptions> | null,
    load: (config: InputArgs<U, FilterOptions>) => void,
    unload: () => void,
    loading: boolean,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DataSyncProviderContext = createContext<DataSyncProviderState<any, any> | null>(null);

export const DataSyncProvider = <U extends EntityUtil<SchemaMap>, FilterOptions>({
    children }: { children: React.ReactNode }) => {

    const [loading, setLoading] = useState<boolean>(false);
    // const [config, setConfig] = useState<InputArgs<U, FilterOptions> | null>(null);
    const [orchestrator, setOrchestrator] = useState<DataOrchestrator<U, FilterOptions> | null>(null);

    // const loadOrchestrator = useCallback(async () => {
    //     setLoading(true);

    //     let cancelled = false;
    //     let currentInstance = null;

    //     await DataOrchestrator.load<U, FilterOptions>(config);
    //     console.log('Orchestrator loaded', DataOrchestrator.getInstance<U, FilterOptions>());
    //     setOrchestrator(DataOrchestrator.getInstance<U, FilterOptions>());
    //     setLoading(false);

    //     return (async () => {
    //         setLoading(true);
    //         if (config && orchestrator) {
    //             await DataOrchestrator.unload();
    //             setOrchestrator(null);
    //         }
    //         setLoading(false);
    //     })();
    // }, [config]);

    const chain = useRef(Promise.resolve());

    const load = useCallback(async (config: InputArgs<U, FilterOptions>) => {
        chain.current = chain.current.then(async () => {
            setLoading(true);

            if (orchestrator) {
                await DataOrchestrator.unload();
                setOrchestrator(null);
            }

            await DataOrchestrator.load<U, FilterOptions>(config);
            setOrchestrator(DataOrchestrator.getInstance<U, FilterOptions>());
            setLoading(false);
        });
    }, [orchestrator]);

    const unload = useCallback(async () => {
        chain.current = chain.current.then(async () => {
            setLoading(true);
            if (orchestrator) {
                await DataOrchestrator.unload();
                setOrchestrator(null);
            }
            setLoading(false);
        });
    }, [orchestrator]);

    // useEffect(() => {
    //     return loadOrchestrator();
    // }, [loadOrchestrator]);

    return (
        <DataSyncProviderContext.Provider value={{ loading, load: load, unload: unload, orchestrator }}>
            {children}
        </DataSyncProviderContext.Provider>
    )
}

export const useDataSync = <U extends EntityUtil<SchemaMap>, FilterOptions>(): DataSyncProviderState<U, FilterOptions> => {
    const context = useContext(DataSyncProviderContext);
    if (!context) {
        throw new Error("useDataSync must be used within a DataSyncProvider");
    }
    return context as DataSyncProviderState<U, FilterOptions>;
}
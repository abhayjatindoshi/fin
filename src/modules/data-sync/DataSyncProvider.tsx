import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { DataOrchestrator } from "./DataOrchestrator"
import type { EntityUtil } from "./EntityUtil"
import type { InputArgs, SchemaMap } from "./interfaces/types"

type DataSyncProviderState<U extends EntityUtil<SchemaMap>, FilterOptions> = {
    orchestrator: DataOrchestrator<U, FilterOptions> | null,
    prefix: string | null,
    setPrefix: (prefix: string) => void,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DataSyncProviderContext = createContext<DataSyncProviderState<any, any> | null>(null);

type DataSyncProviderProps<U extends EntityUtil<SchemaMap>, FilterOptions> = {
    config: Omit<InputArgs<U, FilterOptions>, 'prefix'>,
    children: React.ReactNode,
    loadingComponent?: React.ReactNode,
}

const DefaultLoadingComponent = <div>Loading...</div>;

export const DataSyncProvider = <U extends EntityUtil<SchemaMap>, FilterOptions>({
    config,
    children,
    loadingComponent = DefaultLoadingComponent
}: DataSyncProviderProps<U, FilterOptions>) => {

    const [loading, setLoading] = useState<boolean>(false);
    const [prefix, setPrefix] = useState<string | null>(null);
    const [orchestrator, setOrchestrator] = useState<DataOrchestrator<U, FilterOptions> | null>(null);

    const loadOrchestrator = useCallback(async () => {
        setLoading(true);
        if (!prefix) {
            if (orchestrator) {
                await DataOrchestrator.unload();
            }
        } else {
            await DataOrchestrator.load<U, FilterOptions>({
                ...config,
                prefix,
            });
            setOrchestrator(DataOrchestrator.getInstance<U, FilterOptions>());
        }
        setLoading(false);

        return async () => {
            setLoading(true);
            if (prefix && orchestrator) {
                await DataOrchestrator.unload();
                setOrchestrator(null);
            }
            setLoading(false);
        }
    }, [prefix, config]);

    useEffect(() => {
        loadOrchestrator();
    }, [loadOrchestrator]);

    return (loading ? loadingComponent :
        <DataSyncProviderContext.Provider value={{ prefix, setPrefix, orchestrator }}>
            {children}
        </DataSyncProviderContext.Provider>
    )
}

export const useDataSync = <U extends EntityUtil<SchemaMap>, FilterOptions>(): DataSyncProviderState<U, FilterOptions> => {
    const context = useContext(DataSyncProviderContext);
    if (context === undefined)
        throw new Error("useDataSync must be used within a DataSyncProvider");
    return context as DataSyncProviderState<U, FilterOptions>;
}
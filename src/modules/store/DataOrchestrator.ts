import type { IPersistence } from "../store/interfaces/IPersistence";
import type { IStore } from "../store/interfaces/IStore";

export class DataOrchestrator {
    private static instance: DataOrchestrator | null = null;
    private prefix: string;
    private store: IStore;
    private local: IPersistence;
    private cloud: IPersistence;

    // Private constructor to enforce singleton pattern
    private constructor(prefix: string, store: IStore, local: IPersistence, cloud: IPersistence) {
        this.prefix = prefix;
        this.store = store;
        this.local = local;
        this.cloud = cloud;
    }

    // Load function to initialize the singleton instance
    public static load(prefix: string, store: IStore, local: IPersistence, cloud: IPersistence): void {
        if (!DataOrchestrator.instance) {
            DataOrchestrator.instance = new DataOrchestrator(prefix, store, local, cloud);
        }
    }

    // Unload function to clear the singleton instance
    public static unload(): void {
        DataOrchestrator.instance = null;
    }

    // Get the singleton instance
    public static getInstance(): DataOrchestrator {
        if (!DataOrchestrator.instance) {
            throw new Error("DataOrchestrator is not loaded. Call load() first.");
        }
        return DataOrchestrator.instance;
    }

    // ...other service methods can be added here...
}

import type { IPersistence } from "../store/interfaces/IPersistence";
import type { IStore } from "../store/interfaces/IStore";
import { SyncScheduler } from "./SyncScheduler";

export class DataOrchestrator {
    private static instance: DataOrchestrator | null = null;
    private prefix: string;
    private store: IStore;
    private local: IPersistence;
    private cloud: IPersistence;
    private intervals: Array<NodeJS.Timeout> = [];
    private sync: SyncScheduler;

    // Load function to initialize the singleton instance
    public static load(prefix: string, store: IStore, local: IPersistence, cloud: IPersistence): void {
        if (DataOrchestrator.instance) DataOrchestrator.unload();
        DataOrchestrator.instance = new DataOrchestrator(prefix, store, local, cloud);
        DataOrchestrator.instance.startIntervals();
    }

    // Unload function to clear the singleton instance
    public static unload(): void {
        DataOrchestrator.instance?.stopIntervals();
        DataOrchestrator.instance?.sync.shutdown();
        DataOrchestrator.instance = null;
    }

    // Get the singleton instance
    public static getInstance(): DataOrchestrator {
        if (!DataOrchestrator.instance) {
            throw new Error("DataOrchestrator is not loaded. Call load() first.");
        }
        return DataOrchestrator.instance;
    }

    // Private constructor to enforce singleton pattern
    private constructor(prefix: string, store: IStore, local: IPersistence, cloud: IPersistence) {
        this.prefix = prefix;
        this.store = store;
        this.local = local;
        this.cloud = cloud;
        this.intervals = [];
        this.sync = new SyncScheduler(this.prefix);
    }

    private startIntervals(): void {
        // every 2 seconds
        this.intervals.push(setInterval(() => this.sync.triggerSync(this.store, this.local), 2 * 1000));
        // every 5 minutes
        this.intervals.push(setInterval(() => this.sync.triggerSync(this.local, this.cloud), 5 * 60 * 1000));
    }

    private stopIntervals(): void {
        this.intervals.forEach(clearInterval);
        this.intervals = [];
    }


}

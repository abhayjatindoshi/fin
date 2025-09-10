import { DataOrchestrator } from './DataOrchestrator';
import type { IPersistence } from './interfaces/IPersistence';
import type { IStore } from './interfaces/IStore';

export class DataOrchestratorFactory {
    private static instance: DataOrchestrator | null = null;

    static create(store: IStore, persistence: IPersistence): DataOrchestrator {
        if (!this.instance) {
            this.instance = new DataOrchestrator(store, persistence);
        }
        return this.instance;
    }

    static getInstance(): DataOrchestrator {
        if (!this.instance) {
            throw new Error('DataOrchestrator has not been created yet. Call create() first.');
        }
        return this.instance;
    }
}

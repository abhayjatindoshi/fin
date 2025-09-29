import { DataOrchestrator } from "../data-sync/DataOrchestrator";
import type { DateStrategyOptions } from "../data-sync/strategies/EntityKeyDateStrategy";
import { DateStrategy } from "./store/DateStrategy";
import { DrivePersistence } from "./store/DrivePersistence";
import { GoogleDriveLogin } from "./store/GoogleDriveLogin";
import { LocalPersistence } from "./store/LocalPersistence";
import { MemStore } from "./store/MemStore";

export type AppLoadStatus = 'notStarted' | 'loggingIn' | 'syncing' | 'ready';

export class AppInitializer {
    private static instance: AppInitializer;
    static getInstance(): AppInitializer {
        if (!this.instance) {
            this.instance = new AppInitializer();
        }
        return this.instance;
    }

    status: AppLoadStatus = 'notStarted';
    private prefix = 'app';
    private login = GoogleDriveLogin.getInstance();

    async load(): Promise<void> {
        console.log(`AppInitializer status: ${this.status}, Login status: ${this.login.status}`);
        switch (this.status) {
            case 'notStarted':
                this.status = 'loggingIn';
                await this.login.op();
                break;
            case 'loggingIn':
                if (this.login.status !== 'ready') {
                    await this.login.op();
                } else {
                    await DrivePersistence.getInstance().ensureFileMap();
                    this.status = 'syncing';
                }
                break;
            case 'syncing':
                if (this.login.status === 'ready') {
                    await this.loadOrchestrator();
                    this.status = 'ready';
                }
                break;
            case 'ready':
                // All set
                break;
        }
    }

    async loadOrchestrator(): Promise<void> {
        await DataOrchestrator.load<DateStrategyOptions>({
            prefix: this.prefix,
            store: new MemStore(),
            local: new LocalPersistence(),
            cloud: DrivePersistence.getInstance(),
            strategy: new DateStrategy(),
        });
    }
}




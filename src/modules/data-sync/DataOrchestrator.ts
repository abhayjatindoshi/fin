import { ConsoleLogHandler } from "./ConsoleLogHandler";
import { DataManager } from "./DataManager";
import { DataRepository } from "./DataRepository";
import { EntityEventHandler } from "./EntityEventHandler";
import { EntityKeyHandler } from "./EntityKeyHandler";
import type { Entity } from "./interfaces/Entity";
import type { IEntityKeyStrategy } from "./interfaces/IEntityKeyStrategy";
import type { ILogger } from "./interfaces/ILogger";
import type { IPersistence } from "./interfaces/IPersistence";
import type { IStore } from "./interfaces/IStore";
import type { EntityName } from "./interfaces/types";
import { Logger } from "./Logger";
import { MetadataManager } from "./MetadataManager";
import { ObservableManager } from "./ObservableManager";
import { SyncScheduler } from "./SyncScheduler";

type Context<FilterOptions> = {
    prefix: string;
    store: IStore;
    local: IPersistence;
    cloud?: IPersistence;
    dataManager: DataManager<FilterOptions>;
    entityEventHandler: EntityEventHandler;
    entityKeyHandler: EntityKeyHandler<FilterOptions>;
    logger: ILogger;
    metadataManager: MetadataManager;
    observableManager: ObservableManager<FilterOptions>;
    strategy: IEntityKeyStrategy<FilterOptions>;
    syncScheduler: SyncScheduler;
}

type InputArgs<FilterOptions> = {
    prefix: string;
    store: IStore;
    local: IPersistence;
    cloud?: IPersistence;
    strategy: IEntityKeyStrategy<FilterOptions>;
    logger?: ILogger;
}

export class DataOrchestrator<FilterOptions> {

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private static instance: DataOrchestrator<any> | null = null;

    public static getInstance<FilterOptions>(): DataOrchestrator<FilterOptions> {
        if (!DataOrchestrator.instance) {
            throw new Error("DataOrchestrator is not loaded");
        }
        return DataOrchestrator.instance;
    }

    public static async load<FilterOptions>(args: InputArgs<FilterOptions>): Promise<void> {
        if (DataOrchestrator.instance && args.prefix === DataOrchestrator.instance.ctx.prefix) return;
        await DataOrchestrator.unload();
        DataOrchestrator.instance = new DataOrchestrator(args);
        await DataOrchestrator.instance.load();
    }

    public static async unload(): Promise<void> {
        await DataOrchestrator.instance?.unload();
        DataOrchestrator.instance = null;
    }

    private ctx: Context<FilterOptions>;
    private intervals: Array<NodeJS.Timeout> = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private repoMap: Record<string, DataRepository<any, FilterOptions>> = {};

    constructor(args: InputArgs<FilterOptions>) {
        const { prefix, store, local, cloud, strategy } = args;
        const logger = args.logger ?? new Logger(new ConsoleLogHandler());
        const entityEventHandler = new EntityEventHandler(logger);
        const entityKeyHandler = new EntityKeyHandler(logger, prefix, strategy);
        const metadataManager = new MetadataManager(logger, prefix, entityEventHandler, store, local, cloud);
        const syncScheduler = new SyncScheduler(logger, metadataManager);
        const dataManager = new DataManager(logger, metadataManager, entityKeyHandler, entityEventHandler, store, local, cloud);
        const observableManager = new ObservableManager(logger, dataManager, entityKeyHandler, entityEventHandler);
        this.ctx = {
            prefix, store, local, cloud, strategy, syncScheduler,
            entityKeyHandler, entityEventHandler, metadataManager,
            dataManager, observableManager, logger
        };
    }

    private async load(): Promise<void> {
        if (this.ctx.cloud) await this.ctx.syncScheduler.sync(this.ctx.local, this.ctx.cloud);
        await this.ctx.syncScheduler.sync(this.ctx.local, this.ctx.store);
        this.startIntervals();
    }

    private async unload(): Promise<void> {
        this.stopIntervals();
        await this.ctx.syncScheduler.gracefullyShutdown();
    }

    private startIntervals(): void {
        // every 2 seconds, sync from store to local
        this.intervals.push(setInterval(() => this.ctx.syncScheduler.triggerSync(this.ctx.store, this.ctx.local), 2 * 1000));

        // every 5 minutes, if cloud is configured, sync from local to cloud
        this.intervals.push(setInterval(() => this.ctx.cloud && this.ctx.syncScheduler.triggerSync(this.ctx.local, this.ctx.cloud!), 5 * 60 * 1000));
    }

    private stopIntervals(): void {
        this.intervals.forEach(clearInterval);
        this.intervals = [];
    }

    public repo<E extends Entity>(entityName: EntityName<E>): DataRepository<E, FilterOptions> {
        if (!this.repoMap[entityName]) {
            this.repoMap[entityName] = new DataRepository(entityName, this.ctx.dataManager, this.ctx.observableManager);
        }
        return this.repoMap[entityName] as DataRepository<E, FilterOptions>;
    }

}
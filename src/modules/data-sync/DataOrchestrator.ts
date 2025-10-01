import { ConsoleLogHandler } from "./ConsoleLogHandler";
import { DataManager } from "./DataManager";
import { DataRepository } from "./DataRepository";
import { EntityEventHandler } from "./EntityEventHandler";
import { EntityKeyHandler } from "./EntityKeyHandler";
import type { EntityUtil } from "./EntityUtil";
import type { Context, EntityNameOf, InputArgs, SchemaMap } from "./interfaces/types";
import { Logger } from "./Logger";
import { MetadataManager } from "./MetadataManager";
import { ObservableManager } from "./ObservableManager";
import { SyncScheduler } from "./SyncScheduler";

export class DataOrchestrator<U extends EntityUtil<SchemaMap>, FilterOptions> {

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private static instance: DataOrchestrator<any, any> | null = null;

    public static getInstance<U extends EntityUtil<SchemaMap>, FilterOptions>(): DataOrchestrator<U, FilterOptions> {
        if (!DataOrchestrator.instance) {
            throw new Error("DataOrchestrator is not loaded");
        }
        return DataOrchestrator.instance;
    }

    public static async load<U extends EntityUtil<SchemaMap>, FilterOptions>(args: InputArgs<U, FilterOptions>): Promise<void> {
        if (DataOrchestrator.instance && args.prefix === DataOrchestrator.instance.ctx.prefix) return;
        await DataOrchestrator.unload();
        DataOrchestrator.instance = new DataOrchestrator(args);
        await DataOrchestrator.instance.load();
    }

    public static async unload(): Promise<void> {
        await DataOrchestrator.instance?.unload();
        DataOrchestrator.instance = null;
    }

    ctx: Context<U, FilterOptions>;
    private intervals: Array<NodeJS.Timeout> = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private repoMap: Record<string, DataRepository<U, any, FilterOptions>> = {};

    constructor(args: InputArgs<U, FilterOptions>) {
        const { util, prefix, store, local, cloud, strategy } = args;
        const logger = args.logger ?? new Logger(new ConsoleLogHandler());
        const entityEventHandler = new EntityEventHandler(logger);
        const entityKeyHandler = new EntityKeyHandler(logger, prefix, strategy);
        const metadataManager = new MetadataManager(logger, prefix, entityEventHandler, store, local, cloud);
        const syncScheduler = new SyncScheduler(logger, metadataManager, entityEventHandler);
        const dataManager = new DataManager<U, FilterOptions>(logger, util, metadataManager, entityKeyHandler, entityEventHandler, store, local, cloud);
        const observableManager = new ObservableManager<U, FilterOptions>(logger, dataManager, entityKeyHandler, entityEventHandler);
        this.ctx = {
            util, prefix, store, local, cloud, strategy, syncScheduler,
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

    public repo<N extends EntityNameOf<U>>(entityName: N): DataRepository<U, N, FilterOptions> {
        if (!this.repoMap[entityName]) {
            this.repoMap[entityName] = new DataRepository(entityName, this.ctx.dataManager, this.ctx.observableManager);
        }
        return this.repoMap[entityName] as DataRepository<U, N, FilterOptions>;
    }

    public async syncNow(): Promise<void> {
        await this.ctx.syncScheduler.sync(this.ctx.store, this.ctx.local);
        if (this.ctx.cloud) await this.ctx.syncScheduler.sync(this.ctx.local, this.ctx.cloud);
    }
}
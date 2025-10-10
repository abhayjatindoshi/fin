import { ConsoleLogHandler } from "./ConsoleLogHandler";
import { DataManager } from "./DataManager";
import { DataRepository } from "./DataRepository";
import type { Tenant } from "./entities/Tenant";
import { EntityEventHandler } from "./EntityEventHandler";
import { EntityKeyHandler } from "./EntityKeyHandler";
import type { EntityUtil } from "./EntityUtil";
import type { Context, EntityNameOf, InputArgs, SchemaMap } from "./interfaces/types";
import { Logger } from "./Logger";
import { MetadataManager } from "./MetadataManager";
import { ObservableManager } from "./ObservableManager";
import { SyncScheduler } from "./SyncScheduler";

export class DataOrchestrator<U extends EntityUtil<SchemaMap>, FilterOptions, T extends Tenant> {

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private static instance: DataOrchestrator<any, any, any> | null = null;

    public static getInstance<U extends EntityUtil<SchemaMap>, FilterOptions, T extends Tenant>(): DataOrchestrator<U, FilterOptions, T> {
        if (!DataOrchestrator.instance) {
            throw new Error("DataOrchestrator is not loaded");
        }
        return DataOrchestrator.instance;
    }

    public static async load<U extends EntityUtil<SchemaMap>, FilterOptions, T extends Tenant>(args: InputArgs<U, FilterOptions, T>): Promise<void> {
        await DataOrchestrator.unload();
        const instance = new DataOrchestrator(args);
        await instance.load();
        DataOrchestrator.instance = instance;
    }

    public static async unload(): Promise<void> {
        await DataOrchestrator.instance?.unload();
        DataOrchestrator.instance = null;
    }

    ctx: Context<U, FilterOptions, T>;
    private intervals: Array<NodeJS.Timeout> = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private repoMap: Record<string, DataRepository<U, any, FilterOptions, T>> = {};

    constructor(args: InputArgs<U, FilterOptions, T>) {
        const { util, tenant, store, local, cloud, strategy } = args;
        const logger = args.logger ?? new Logger(new ConsoleLogHandler());
        const entityEventHandler = new EntityEventHandler(logger);
        const entityKeyHandler = new EntityKeyHandler(logger, strategy);
        const metadataManager = new MetadataManager(logger, tenant, entityEventHandler, store, local, cloud);
        const syncScheduler = new SyncScheduler(logger, tenant, metadataManager, entityEventHandler);
        const dataManager = new DataManager<U, FilterOptions, T>(logger, util, tenant, metadataManager, entityKeyHandler, entityEventHandler, store, local, cloud);
        const observableManager = new ObservableManager<U, FilterOptions, T>(logger, dataManager, entityKeyHandler, entityEventHandler);
        this.ctx = {
            util, tenant, store, local, cloud, strategy, syncScheduler,
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
        await this.ctx.syncScheduler.sync(this.ctx.store, this.ctx.local);
        if (this.ctx.cloud) await this.ctx.syncScheduler.sync(this.ctx.local, this.ctx.cloud);
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

    public repo<N extends EntityNameOf<U>>(entityName: N): DataRepository<U, N, FilterOptions, T> {
        if (!this.repoMap[entityName]) {
            this.repoMap[entityName] = new DataRepository(entityName, this.ctx.dataManager, this.ctx.observableManager);
        }
        return this.repoMap[entityName] as DataRepository<U, N, FilterOptions, T>;
    }

    public async syncNow(): Promise<void> {
        await this.ctx.syncScheduler.sync(this.ctx.store, this.ctx.local);
        if (this.ctx.cloud) await this.ctx.syncScheduler.sync(this.ctx.local, this.ctx.cloud);
    }
}
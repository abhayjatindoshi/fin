import type { EntityEventHandler } from "./EntityEventHandler";
import type { EntityUtil } from "./EntityUtil";
import type { ILogger } from "./interfaces/ILogger";
import type { IPersistence } from "./interfaces/IPersistence";
import type { SchemaMap } from "./interfaces/types";
import type { MetadataManager } from "./MetadataManager";
import { SyncHandler } from "./SyncHandler";


type SyncItem = {
    source: IPersistence;
    target: IPersistence;
    promise: Promise<void>;
    resolve: () => void;
    reject: (error: unknown) => void;
}

export class SyncScheduler<U extends EntityUtil<SchemaMap>> {
    private logger: ILogger;
    private queue: Array<SyncItem> = [];
    private running = false;
    private metadataManager: MetadataManager<U>;
    private entityEventHandler: EntityEventHandler<U>;
    private shuttingDown = false;
    private timeout = 200;

    constructor(logger: ILogger, metadataManager: MetadataManager<U>, entityEventHandler: EntityEventHandler<U>) {
        this.logger = logger;
        this.metadataManager = metadataManager;
        this.entityEventHandler = entityEventHandler;
        setTimeout(() => this.tick(), this.timeout);
    }

    async sync(source: IPersistence, target: IPersistence): Promise<void> {
        if (this.shuttingDown) throw new Error("SyncScheduler is shutting down");
        return this.enqueue(source, target);
    }

    triggerSync(source: IPersistence, target: IPersistence): void {
        if (this.shuttingDown) throw new Error("SyncScheduler is shutting down");
        this.enqueue(source, target);
    }

    async gracefullyShutdown(): Promise<void> {
        this.logger.v(this.constructor.name, 'Shutting down gracefully');
        this.shuttingDown = true;
        while (this.running || this.queue.length > 0) {
            this.logger.v(this.constructor.name, `Waiting for ${this.queue.length} sync(s) to complete...`);
            await new Promise(res => setTimeout(res, 100));
        }
        this.logger.i(this.constructor.name, 'Shutdown complete');
    }

    private enqueue(source: IPersistence, target: IPersistence): Promise<void> {
        const existingItem = this.queue.find(item => item.source === source && item.target === target);
        if (existingItem) {
            return existingItem.promise;
        }

        let resolve!: () => void;
        let reject!: (error: unknown) => void;
        const promise = new Promise<void>((res, rej) => {
            resolve = res;
            reject = rej;
        });
        const syncItem: SyncItem = { source, target, promise, resolve, reject };
        this.queue.push(syncItem);
        return promise;
    }

    private async tick(): Promise<void> {
        const item = this.queue.shift();
        if (item) {
            const time = new Date();
            this.logger.i(this.constructor.name, `Starting sync [${item.source.constructor.name}] -> [${item.target.constructor.name}]`, item);
            try {
                await SyncHandler.sync(this.logger, this.metadataManager, this.entityEventHandler, item.source, item.target);
                item.resolve();
                this.logger.i(this.constructor.name, `Completed sync [${item.source.constructor.name}] -> [${item.target.constructor.name}] time: ${new Date().getTime() - time.getTime()}ms`, item);
            } catch (err) {
                item.reject(err);
                this.logger.e(this.constructor.name, `Sync failed [${item.source.constructor.name}] -> [${item.target.constructor.name}] time: ${new Date().getTime() - time.getTime()}ms`, { error: err, item });
            }
        }

        setTimeout(() => this.tick(), this.timeout);
    }
}
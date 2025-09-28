import type { ILogger } from "./interfaces/ILogger";
import type { IPersistence } from "./interfaces/IPersistence";
import type { MetadataManager } from "./MetadataManager";
import { SyncHandler } from "./SyncHandler";


type SyncItem = {
    source: IPersistence;
    target: IPersistence;
    promise: Promise<void>;
    resolve: () => void;
    reject: (error: unknown) => void;
}

export class SyncScheduler {
    private logger: ILogger;
    private queue: Array<SyncItem> = [];
    private running = false;
    private metadataManager: MetadataManager;
    private shuttingDown = false;

    constructor(logger: ILogger, metadataManager: MetadataManager) {
        this.logger = logger;
        this.metadataManager = metadataManager;
        setTimeout(() => this.tick(), 200);
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
                await SyncHandler.sync(this.logger, this.metadataManager, item.source, item.target);
                item.resolve();
                this.logger.i(this.constructor.name, `Completed sync [${item.source.constructor.name}] -> [${item.target.constructor.name}] time: ${new Date().getTime() - time.getTime()}ms`, item);
            } catch (err) {
                item.reject(err);
                this.logger.e(this.constructor.name, `Sync failed [${item.source.constructor.name}] -> [${item.target.constructor.name}] time: ${new Date().getTime() - time.getTime()}ms`, { error: err, item });
            }
        }

        setTimeout(() => this.tick(), 200);
    }

    // private async runWorker(): Promise<void> {
    //     // if (this.running) return;
    //     // this.running = true;

    //     try {
    //         while (this.queue.length > 0) {
    //             const item = this.queue.shift()!;
    //             this.logger.i(this.constructor.name, `Starting sync [${item.source.constructor.name}] -> [${item.target.constructor.name}]`, item);

    //             try {
    //                 await SyncHandler.sync(this.logger, this.metadataManager, item.source, item.target);
    //                 item.resolve();
    //                 this.logger.i(this.constructor.name, `Completed sync [${item.source.constructor.name}] -> [${item.target.constructor.name}]`, item);
    //             } catch (err) {
    //                 item.reject(err);
    //                 this.logger.e(this.constructor.name, `Sync failed [${item.source.constructor.name}] -> [${item.target.constructor.name}]`, { error: err, item });
    //             }
    //         }
    //     } finally {
    //         // this.running = false;
    //     }
    // }

    // private next(): void {
    //     if (this.running) return;
    //     const item = this.queue.shift();
    //     if (!item) return;
    //     this.running = true;
    //     this.executeSync(item)
    //         .finally(() => {
    //             this.running = false;
    //             this.next();
    //         });
    // }

    // private executeSync = async (item: SyncItem): Promise<void> => {
    //     this.logger.i(this.constructor.name, `Starting sync [${item.source.constructor.name}] -> [${item.target.constructor.name}]`, item);
    //     await SyncHandler.sync(this.logger, this.metadataManager, item.source, item.target)
    //         .then(item.resolve)
    //         .catch(item.reject);
    //     this.logger.i(this.constructor.name, `Completed sync [${item.source.constructor.name}] -> [${item.target.constructor.name}]`, item);
    // }
}
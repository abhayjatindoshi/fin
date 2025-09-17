import type { IPersistence } from "./interfaces/IPersistence";
import { SyncHandler } from "./SyncHandler";

type SyncItem = {
    source: IPersistence;
    target: IPersistence;
    promise: Promise<void>;
    resolve: () => void;
    reject: (error: unknown) => void;
}

export class SyncScheduler {
    private queue: Array<SyncItem> = [];
    private running = false;
    private prefix: string;
    private shuttingDown = false;

    constructor(prefix: string) {
        this.prefix = prefix;
    }

    async sync(source: IPersistence, target: IPersistence): Promise<void> {
        if (this.shuttingDown) throw new Error("SyncScheduler is shutting down");
        return this.enqueue(source, target);
    }

    triggerSync(source: IPersistence, target: IPersistence): void {
        if (this.shuttingDown) throw new Error("SyncScheduler is shutting down");
        this.enqueue(source, target);
    }

    async shutdown(): Promise<void> {
        this.shuttingDown = true;
        while (this.running || this.queue.length > 0) {
            await new Promise(res => setTimeout(res, 100));
        }
    }

    private enqueue(source: IPersistence, target: IPersistence): Promise<void> {
        const existingItem = this.queue.find(item => item.source === source && item.target === target);
        if (existingItem) return existingItem.promise;

        let resolve!: () => void;
        let reject!: (error: unknown) => void;
        const promise = new Promise<void>((res, rej) => {
            resolve = res;
            reject = rej;
        });
        const syncItem: SyncItem = { source, target, promise, resolve, reject };
        this.queue.push(syncItem);
        if (!this.running) this.next();
        return promise;
    }

    private next(): void {
        if (this.running) return;
        const item = this.queue.shift();
        if (!item) return;
        this.running = true;
        this.executeSync(item)
            .finally(() => {
                this.running = false;
                this.next();
            });
    }

    private executeSync = (item: SyncItem): Promise<void> =>
        SyncHandler.sync(this.prefix, item.source, item.target)
            .then(item.resolve)
            .catch(item.reject);
}
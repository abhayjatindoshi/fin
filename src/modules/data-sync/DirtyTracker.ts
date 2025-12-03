import { BehaviorSubject, Observable } from "rxjs";
import type { Tenant } from "./entities/Tenant";
import type { IPersistence } from "./interfaces/IPersistence";

export class DirtyTracker<T extends Tenant> {

    private storeVersion = 0;
    private localVersion = 0;
    private cloudVersion = 0;
    private store: IPersistence<T>;
    private local: IPersistence<T>;
    private cloud?: IPersistence<T>;
    private dirtySubject = new BehaviorSubject<boolean>(false);

    constructor(store: IPersistence<T>, local: IPersistence<T>, cloud?: IPersistence<T>) {
        this.store = store;
        this.local = local;
        this.cloud = cloud;
    }

    getVersion(persistence: IPersistence<T>): number {
        if (persistence === this.store) return this.storeVersion;
        if (persistence === this.local) return this.localVersion;
        if (persistence === this.cloud) return this.cloudVersion;
        throw new Error("Unknown persistence");
    }

    setVersion(persistence: IPersistence<T>, version: number): void {
        if (persistence === this.store) this.storeVersion = version;
        else if (persistence === this.local) this.localVersion = version;
        else if (persistence === this.cloud) this.cloudVersion = version;
        else throw new Error("Unknown persistence");
        this.recalculateDirty();
    }

    notifyStoreUpdated(): void {
        this.storeVersion++;
        this.recalculateDirty();
    }

    observe(): Observable<boolean> {
        return this.dirtySubject.asObservable();
    }

    isDirty(): boolean {
        return this.dirtySubject.value;
    }

    private recalculateDirty(): void {
        const dirty = this.storeVersion != this.localVersion || this.storeVersion != this.cloudVersion;
        if (this.dirtySubject.value !== dirty) {
            this.dirtySubject.next(dirty);
        }
    }

}
import { Observable } from 'rxjs';
import type { Entity, EntityName, QueryOptions } from './interfaces/Entity';
import type { IPersistence } from './interfaces/IPersistence';
import type { IStore } from './interfaces/IStore';

export class DataOrchestrator {
    private store: IStore;
    private persistence: IPersistence;
    // Dirty key and watcher logic can be implemented as needed

    constructor(store: IStore, persistence: IPersistence) {
        this.store = store;
        this.persistence = persistence;
    }

    async get<T extends Entity>(entityName: EntityName, id: string): Promise<T | null> {
        // TODO: implement
        throw new Error('Not implemented');
    }

    getObservable<T extends Entity>(entityName: EntityName, id: string): Observable<T | null> {
        // TODO: implement
        throw new Error('Not implemented');
    }

    async getAll<T extends Entity>(entityName: EntityName): Promise<T[]> {
        // TODO: implement
        throw new Error('Not implemented');
    }

    getAllObservable<T extends Entity>(entityName: EntityName): Observable<T[]> {
        // TODO: implement
        throw new Error('Not implemented');
    }

    async getFiltered<T extends Entity>(entityName: EntityName, options: QueryOptions): Promise<T[]> {
        // TODO: implement
        throw new Error('Not implemented');
    }

    getFilteredObservable<T extends Entity>(entityName: EntityName, options: QueryOptions): Observable<T[]> {
        // TODO: implement
        throw new Error('Not implemented');
    }

    async save<T extends Entity>(entityName: EntityName, data: T): Promise<boolean> {
        // TODO: implement
        throw new Error('Not implemented');
    }

    async delete(entityName: EntityName, id: string): Promise<void> {
        // TODO: implement
        throw new Error('Not implemented');
    }

    async flush(): Promise<void> {
        // TODO: implement
        throw new Error('Not implemented');
    }

    // subscribe, unsubscribe, and notifyWatchers can be implemented as needed
}

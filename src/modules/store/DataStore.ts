import { Observable } from 'rxjs';
import { DataOrchestratorFactory } from './DataOrchestratorFactory';
import type { Entity, EntityName, QueryOptions } from './interfaces/Entity';

export class DataStore<T extends Entity> {
    private static instances: Map<EntityName, DataStore<Entity>> = new Map();
    private entityName: EntityName;
    private orchestrator = DataOrchestratorFactory.getInstance();

    private constructor(entityName: EntityName) {
        this.entityName = entityName;
    }

    static getInstance<T extends Entity>(entityName: EntityName): DataStore<T> {
        if (!this.instances.has(entityName)) {
            this.instances.set(entityName, new DataStore<T>(entityName));
        }
        return this.instances.get(entityName) as DataStore<T>;
    }

    async get(id: string): Promise<T | null> {
        return this.orchestrator.get<T>(this.entityName, id);
    }

    getObservable(id: string): Observable<T | null> {
        return this.orchestrator.getObservable<T>(this.entityName, id);
    }

    async getAll(): Promise<T[]> {
        return this.orchestrator.getAll<T>(this.entityName);
    }

    getAllObservable(): Observable<T[]> {
        return this.orchestrator.getAllObservable<T>(this.entityName);
    }

    async getFiltered(options: QueryOptions): Promise<T[]> {
        return this.orchestrator.getFiltered<T>(this.entityName, options);
    }

    getFilteredObservable(options: QueryOptions): Observable<T[]> {
        return this.orchestrator.getFilteredObservable<T>(this.entityName, options);
    }

    async save(data: T): Promise<boolean> {
        return this.orchestrator.save<T>(this.entityName, data);
    }

    async delete(id: string): Promise<void> {
        return this.orchestrator.delete(this.entityName, id);
    }
}

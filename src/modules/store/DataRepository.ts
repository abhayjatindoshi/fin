import type { Observable } from "rxjs";
import { DataOrchestrator } from "./DataOrchestrator";
import type { EntityName, EntityType } from "./interfaces/Entity";
import type { QueryOptions } from "./interfaces/QueryOptions";

export class DataRepository<N extends EntityName> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private static instances: Map<string, DataRepository<any>> = new Map();

    public static getInstance<N extends EntityName>(entityName: N): DataRepository<N> {
        if (!DataRepository.instances.has(entityName)) {
            DataRepository.instances.set(entityName, new DataRepository<N>(entityName));
        }
        return DataRepository.instances.get(entityName) as DataRepository<N>;
    }

    private entityName: N;

    private constructor(entityName: N) {
        this.entityName = entityName;
    }

    public get = (id: string): Promise<EntityType<N> | null> =>
        DataOrchestrator.getInstance().get(this.entityName, id)

    public save = (entity: EntityType<N>): Promise<EntityType<N>> =>
        DataOrchestrator.getInstance().save(this.entityName, entity).then(() => entity)

    public delete = (id: string): Promise<void> =>
        DataOrchestrator.getInstance().delete(this.entityName, id)

    public getAll = (options?: QueryOptions): Promise<Array<EntityType<N>>> =>
        DataOrchestrator.getInstance().getAll(this.entityName, options)

    public observe = (id: string): Promise<Observable<EntityType<N> | null>> =>
        DataOrchestrator.getInstance().observe(this.entityName, id)

    public observeAll = (options?: QueryOptions): Promise<Observable<Array<EntityType<N>>>> =>
        DataOrchestrator.getInstance().observeAll(this.entityName, options)
}
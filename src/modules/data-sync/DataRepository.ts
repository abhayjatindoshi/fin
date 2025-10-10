import type { Observable } from "rxjs";
import type { DataManager } from "./DataManager";
import type { Tenant } from "./entities/Tenant";
import type { EntityUtil } from "./EntityUtil";
import type { QueryOptions } from "./interfaces/QueryOptions";
import type { EntityNameOf, EntityTypeOf, SchemaMap } from "./interfaces/types";
import type { ObservableManager } from "./ObservableManager";

export class DataRepository<U extends EntityUtil<SchemaMap>, N extends EntityNameOf<U>, FilterOptions, T extends Tenant> {
    private entityName: N;
    private dataManager: DataManager<U, FilterOptions, T>;
    private observableManager: ObservableManager<U, FilterOptions, T>;

    constructor(entityName: N, dataManager: DataManager<U, FilterOptions, T>, observableManager: ObservableManager<U, FilterOptions, T>) {
        this.entityName = entityName;
        this.dataManager = dataManager;
        this.observableManager = observableManager;
    }

    public get = (id: string): Promise<EntityTypeOf<U, N> | null> =>
        this.dataManager.get(this.entityName, id);

    public getAll = (options?: FilterOptions & QueryOptions): Promise<Array<EntityTypeOf<U, N>>> =>
        this.dataManager.getAll(this.entityName, options);

    public save = (entity: EntityTypeOf<U, N>): string =>
        this.dataManager.save(this.entityName, entity);

    public delete = (id: string): void =>
        this.dataManager.delete(this.entityName, id);

    public observe = async (id: string): Promise<Observable<EntityTypeOf<U, N> | null>> =>
        this.observableManager.observe(this.entityName, id);

    public observeAll = async (options?: FilterOptions & QueryOptions): Promise<Observable<Array<EntityTypeOf<U, N>>>> =>
        this.observableManager.observeAll(this.entityName, options);
}
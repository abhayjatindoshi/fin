import type { Observable } from "rxjs";
import type { DataManager } from "./DataManager";
import type { Entity } from "./interfaces/Entity";
import type { QueryOptions } from "./interfaces/QueryOptions";
import type { EntityName } from "./interfaces/types";
import type { ObservableManager } from "./ObservableManager";

export class DataRepository<E extends Entity, FilterOptions> {
    private entityName: EntityName<E>;
    private dataManager: DataManager<FilterOptions>;
    private observableManager: ObservableManager<FilterOptions>;

    constructor(entityName: EntityName<E>, dataManager: DataManager<FilterOptions>, observableManager: ObservableManager<FilterOptions>) {
        this.entityName = entityName;
        this.dataManager = dataManager;
        this.observableManager = observableManager;
    }

    public get = (id: string): Promise<E | null> =>
        this.dataManager.get(this.entityName, id);

    public getAll = (options?: FilterOptions & QueryOptions): Promise<E[]> =>
        this.dataManager.getAll(this.entityName, options);

    public save = (entity: E): string =>
        this.dataManager.save(this.entityName, entity);

    public delete = (id: string): void =>
        this.dataManager.delete(this.entityName, id);

    public observe = async (id: string): Promise<Observable<E | null>> =>
        this.observableManager.observe(this.entityName, id);

    public observeAll = async (options?: FilterOptions & QueryOptions): Promise<Observable<Array<E>>> =>
        this.observableManager.observeAll(this.entityName, options);
}
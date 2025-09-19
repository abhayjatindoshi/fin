import { BehaviorSubject, Observable } from "rxjs";
import type { Entity, EntityName, EntityType } from "./interfaces/Entity";
import type { QueryOptions } from "./interfaces/QueryOptions";

type SubjectData<T> = {
    subject: BehaviorSubject<T>;
    refCount: number;
};

type SubjectDataMap<T extends Entity> = Record<string, SubjectData<T>>;

type SubjectMap = {
    [N in EntityName]?: SubjectDataMap<EntityType<N> & Entity>;
};

export class ObservableManager {
    private static instance: ObservableManager | null = null;

    public static load() {
        this.instance = new ObservableManager();
    }

    public static unload() {
        this.instance = null;
    }

    public static getInstance(): ObservableManager {
        if (!this.instance) {
            throw new Error("ObservableManager is not loaded. Call load() first.");
        }
        return this.instance;
    }

    private constructor() { }

    private root: RootMap = {};

    private getSubjectMap<N extends EntityName, T extends EntityType<N> & Entity>(entityName: N): SubjectMap<T> {
        let map = this.root[entityName] as SubjectMap<T> | undefined;
        if (!map) {
            this.root[entityName] = map = {};
        }
        return map;
    }

    observe<N extends EntityName, E extends EntityType<N> & Entity>(entityName: N, id: string): Observable<E | null> {
        const map = this.getSubjectMap<N, E>(entityName);

        let entry = map[id];
        if (!entry) {
            entry = {
                subject: new BehaviorSubject<E | null>(null),
                refCount: 0
            };
            map[id] = entry;
        }

        entry.refCount++;

        return new Observable<E | null>(subscriber => {
            const subscription = entry.subject.subscribe(subscriber);
            return () => {
                subscription.unsubscribe();
                entry.refCount--;
                if (entry.refCount === 0) {
                    entry.subject.complete();
                    delete map![id];
                }
            };
        });
    }

    observeCollection<N extends EntityName, T extends EntityType<N> & Entity>(entityName: N, options?: QueryOptions): Observable<Array<T>> {
        const map = this.getSubjectMap<N, T>(entityName);
    }
}
import { BehaviorSubject, map, Observable } from "rxjs";
import type { Entity, EntityName, EntityType } from "./interfaces/Entity";
import { EntityConfigs } from "./interfaces/EntityConfig";
import { filterEntities, type QueryOptions } from "./interfaces/QueryOptions";

type TypedEntity<N extends EntityName> = EntityType<N> & Entity;
type EntityEvent<E extends Entity> = {
    type: 'save' | 'delete';
    id: string;
    entity: E;
}

export class ObservableManager<N extends EntityName, E extends TypedEntity<N>> {
    private entityName: N;
    private entityMap: Record<string, BehaviorSubject<E | null>> = {};
    private collectionSubject = new BehaviorSubject<Record<string, E>>({});

    constructor(entityName: N, initialData: Record<string, E> = {}) {
        this.entityName = entityName;
        this.collectionSubject.next(initialData);
    }

    observe(id: string): Observable<E | null> {
        let entry = this.entityMap[id];
        if (!entry) {
            const collection = this.collectionSubject.value;
            entry = new BehaviorSubject<E | null>(collection[id] || null);
            this.entityMap[id] = entry;
        }

        return new Observable<E | null>(subscriber => {
            const subscription = entry.subscribe(subscriber);

            return () => {
                subscription.unsubscribe();
                if (!entry.observed) {
                    entry.complete();
                    delete this.entityMap[id];
                }
            };
        });
    }

    observeAll(options?: QueryOptions): Observable<Array<E>> {
        return this.collectionSubject.pipe(
            map(collection => {
                const results = Object.values(collection);
                return filterEntities(EntityConfigs[this.entityName], results, options);
            })
        );
    }

    notifyChange(event: EntityEvent<E>): void {
        const collection = { ...this.collectionSubject.value };

        switch (event.type) {
            case 'save':
                collection[event.id] = event.entity;
                this.collectionSubject.next(collection);
                this.entityMap[event.id]?.next(event.entity);
                break;
            case 'delete':
                delete collection[event.id];
                this.collectionSubject.next(collection);
                this.entityMap[event.id]?.next(null);
                break;
        }
    }
}
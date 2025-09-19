import { BehaviorSubject, Observable, map } from 'rxjs';
import type { Entity, EntityName } from './interfaces/Entity';
import { EntityConfigs, type EntityConfig } from './interfaces/EntityConfig';
import { filterEntities, type QueryOptions } from './interfaces/QueryOptions';

export class ObservableManager<T extends Entity> {
    private entitySubjects = new Map<string, {
        subject: BehaviorSubject<T | null>;
        refCount: number;
    }>();

    private collectionSubject = new BehaviorSubject<Map<string, T>>(new Map());

    // Single entity observable
    observe(id: string): Observable<T | null> {
        let entry = this.entitySubjects.get(id);

        if (!entry) {
            entry = {
                subject: new BehaviorSubject<T | null>(null),
                refCount: 0
            };
            this.entitySubjects.set(id, entry);
        }

        entry.refCount++;

        return new Observable<T | null>(subscriber => {
            const subscription = entry!.subject.subscribe(subscriber);

            return () => {
                subscription.unsubscribe();
                entry!.refCount--;
                if (entry!.refCount === 0) {
                    entry!.subject.complete();
                    this.entitySubjects.delete(id);
                }
            };
        });
    }

    // Collection observable with query support
    observeCollection(entityName: EntityName, options?: QueryOptions): Observable<T[]> {
        return this.collectionSubject.pipe(
            map(collection => {
                const results = Array.from(collection.values());
                filterEntities(EntityConfigs[entityName] as EntityConfig<T>, results, options);
                return results;
            })
        );
    }

    // Update methods
    notifyChange(event: EntityEvent<T>): void {
        const collection = new Map(this.collectionSubject.value);

        switch (event.type) {
            case 'create':
            case 'update':
                collection.set(event.id, event.entity);
                this.collectionSubject.next(collection);
                this.entitySubjects.get(event.id)?.subject.next(event.entity);
                break;

            case 'delete':
                collection.delete(event.id);
                this.collectionSubject.next(collection);
                this.entitySubjects.get(event.id)?.subject.next(null);
                break;
        }
    }

    // Bulk update for initial data load
    setInitialData(entities: T[]): void {
        const collection = new Map();
        entities.forEach(entity => {
            collection.set(entity.id, entity);
            this.entitySubjects.get(entity.id)?.subject.next(entity);
        });
        this.collectionSubject.next(collection);
    }
}
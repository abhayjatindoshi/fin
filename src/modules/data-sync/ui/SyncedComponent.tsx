/* eslint-disable @typescript-eslint/no-explicit-any */
import type React from "react";
import { useEffect, useState, type ComponentType } from "react";
import { useParams, type Params } from "react-router-dom";
import { combineLatest, Subscription, type Observable } from "rxjs";
import type { DataOrchestrator } from "../DataOrchestrator";
import { useDataSync } from "../providers/DataSyncProvider";

type ObservableMap = Record<string, Observable<any>>;

type ObservedValues<T extends ObservableMap> = {
    [K in keyof T]: T[K] extends Observable<infer U> ? U : never;
};

// fn that maps orchestrator -> map of observables
type MapObservablesFn<M extends ObservableMap> = (
    orchestrator: DataOrchestrator<any, any, any>
) => M;

// fn that maps orchestrator -> map of observables
type MapObservablesFnWithParams<M extends ObservableMap> = (
    orchestrator: DataOrchestrator<any, any, any>,
    params: Readonly<Params<string>>
) => M;

// Internal factory to create synced HOCs and avoid duplicated logic
function createSyncedComponent<M extends ObservableMap, P extends object>(
    mapFn: (
        orchestrator: DataOrchestrator<any, any, any>,
        params?: Readonly<Params<string>>
    ) => M,
    WrappedComponent: ComponentType<P & ObservedValues<M>>,
    options: { useRouteParams: boolean; displayNamePrefix: string }
): React.FC<Omit<P, keyof ObservedValues<M>>> {
    const SyncedComponent: React.FC<Omit<P, keyof ObservedValues<M>>> = (props) => {
        const { orchestrator } = useDataSync();
        const [values, setValues] = useState<ObservedValues<M> | null>(null);
        const params = options.useRouteParams ? useParams() : undefined;

        useEffect(() => {
            if (!orchestrator) return;
            let subscription: Subscription | undefined;

            (async () => {
                const observables = mapFn(orchestrator, params);

                const keys = Object.keys(observables) as (keyof M)[];
                const combined$ = combineLatest(
                    keys.map((k) => observables[k])
                );

                subscription = combined$.subscribe((vals) => {
                    const mapped = Object.fromEntries(
                        vals.map((v, i) => [keys[i], v])
                    ) as ObservedValues<M>;
                    setValues(mapped);
                });
            })();

            return () => subscription?.unsubscribe();
        }, []);

        if (!orchestrator || !values) return null;

        return <WrappedComponent {...(props as P)} {...(values as ObservedValues<M>)} />;
    };

    SyncedComponent.displayName = `${options.displayNamePrefix}(${WrappedComponent.displayName || WrappedComponent.name || "Component"})`;

    return SyncedComponent;
}

export function withSync<M extends ObservableMap, P extends object>(
    mapFn: MapObservablesFn<M>,
    WrappedComponent: ComponentType<P & ObservedValues<M>>
): React.FC<Omit<P, keyof ObservedValues<M>>> {
    return createSyncedComponent<M, P>(
        (orchestrator) => mapFn(orchestrator),
        WrappedComponent,
        { useRouteParams: false, displayNamePrefix: "withSync" }
    );
}

export function withSyncAndParams<M extends ObservableMap, P extends object>(
    mapFn: MapObservablesFnWithParams<M>,
    WrappedComponent: ComponentType<P & ObservedValues<M>>
): React.FC<Omit<P, keyof ObservedValues<M>>> {
    return createSyncedComponent<M, P>(
        (orchestrator, params) => mapFn(orchestrator, params as Readonly<Params<string>>),
        WrappedComponent,
        { useRouteParams: true, displayNamePrefix: "withSync" }
    );
}
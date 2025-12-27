import { AppLogger } from "@/modules/app/logging/AppLogger";
import { useEffect, useRef, useState, type DependencyList, type EffectCallback } from "react";
import type { Subscription } from "rxjs";

export function unsubscribeAll(...subscriptions: Subscription[]): () => void {
    return () =>
        subscriptions.forEach(subscription => {
            try {
                subscription.unsubscribe();
            } catch { /* empty */ }
        });
}

//create your forceUpdate hook
export function useForceUpdate() {
    const [, setValue] = useState(0); // integer state
    return () => setValue(value => value + 1); // update state to force render
    // A function that increment 👆🏻 the previous state like here 
    // is better than directly setting `setValue(value + 1)`
}

export function toRecord<T extends { [key: string]: any }>(items: T[], key: keyof T): Record<string, T> {
    return items.reduce((map, item) => {
        const keyValue = item[key];
        if (typeof keyValue === 'string') {
            map[keyValue] = item;
        }
        return map;
    }, {} as Record<string, T>);
};

type DependencyChangeRecord = Record<string, { before: any; after: any }>;

export function useEffectDebugger(effect: EffectCallback, dependencies: DependencyList, dependencyNames: string[]) {
    const logger = AppLogger.tagged("useEffectDebugger");
    const previousDeps = usePrevious(dependencies, []);

    const changedDeps: DependencyChangeRecord = dependencies.reduce<DependencyChangeRecord>((accum, dependency, index) => {
        if (dependency !== previousDeps[index]) {
            const keyName = dependencyNames[index] || index;
            return {
                ...accum,
                [keyName]: {
                    before: previousDeps[index],
                    after: dependency,
                },
            };
        }

        return accum;
    }, {});

    if (Object.keys(changedDeps).length) {
        logger.i(changedDeps);
    }

    useEffect(effect, dependencies);
}

function usePrevious(value: DependencyList, initialValue: DependencyList): DependencyList {
    const ref = useRef(initialValue);
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
};
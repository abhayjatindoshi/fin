import { useState } from "react";
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
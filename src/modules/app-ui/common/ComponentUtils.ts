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
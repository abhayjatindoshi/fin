// NotFound illustration set available, currently previewing only the first new illustration
// import type { ComponentType } from 'react';

// type Item = {
//     key: string;
//     title: string;
//     description: string;
//     Component: ComponentType<{ className?: string }>;
// };

// const ITEMS: Item[] = [
//     { key: 'no-transactions-yet', title: 'No Transactions Yet', description: 'A frosted glass wallet and softly floating coins. Calm, inviting, ready to begin.', Component: NoTransactionsYet1 },
// ];

export default function NotFoundPage() {
    return (
        <div className="min-h-[60dvh] px-6 md:px-10 py-10">
            <div className="mx-auto max-w-7xl">
                <header className="mb-8 flex items-end justify-between">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Page not found</h1>
                        <p className="text-muted-foreground mt-1">Preview: frosted glass wallet with floating coins — the first illustration from the new set.</p>
                    </div>
                </header>

                {/* <NoTransactionsYet1 /> */}
            </div>
        </div>
    );
}

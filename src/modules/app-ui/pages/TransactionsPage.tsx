import { EntityName } from "@/modules/app/entities/entities";
import type { Transaction } from "@/modules/app/entities/Transaction";
import EmptyOpenBox from "@/modules/base-ui/components/illustrations/EmptyOpenBox";
import { Spinner } from "@/modules/base-ui/components/ui/spinner";
import { useDataSync } from "@/modules/data-sync/providers/DataSyncProvider";
import { useEffect, useState } from "react";
import { debounceTime, distinctUntilChanged, Subject, switchMap } from "rxjs";
import TransactionsCardView from "../components/transactions/TransactionsCardView";
import TransactionsFilter, { type TransactionFilterOptions } from "../components/transactions/TransactionsFilter";
import TransactionsTableView from "../components/transactions/TransactionsTableView";
import { useApp } from "../providers/AppProvider";

const TransactionsPage: React.FC = () => {

    const { isMobile } = useApp();
    const { orchestrator } = useDataSync();
    const filterSubject = new Subject<TransactionFilterOptions>();
    const [filter, setFilter] = useState<TransactionFilterOptions>({ sort: 'desc' });
    const [transactions, setTransactions] = useState<Array<Transaction> | null>(null);

    useEffect(() => {
        if (!orchestrator) return;
        const repo = orchestrator.repo(EntityName.Transaction);
        const subscription = filterSubject
            .pipe(
                debounceTime(300),
                distinctUntilChanged(),
                switchMap((filter) => {
                    const query = {
                        sort: [{
                            field: 'transactionAt',
                            direction: filter.sort,
                        }],
                        years: filter.years,
                    }

                    return repo.observeAll(query);
                })
            ).subscribe((data) => {
                const transactions = data as Array<Transaction>;
                const result = transactions
                    .filter(t => !filter.accountIds || filter.accountIds.length == 0 || filter.accountIds.includes(t.accountId))
                    .filter(t => !filter.startDate || t.transactionAt >= filter.startDate!)
                    .filter(t => !filter.endDate || t.transactionAt <= filter.endDate!)
                    .filter(t => !filter.searchQuery || t.narration.toLowerCase().includes(filter.searchQuery.toLowerCase()))
                setTransactions(result);
            });

        return () => subscription.unsubscribe();
    }, [orchestrator, filterSubject]);

    useEffect(() => {
        filterSubject.next(filter);
    }, [filter]);

    return (
        <div className="flex flex-col pb-4">
            <TransactionsFilter filter={filter} setFilter={setFilter} />
            {transactions == null ?
                <Spinner className="m-auto justify-center" /> :
                transactions.length === 0 ?
                    <div className="flex flex-col items-center mt-12">
                        <EmptyOpenBox className="mx-auto opacity-50 [&>svg]:size-12" animated={false} />
                        <span className="text-muted-foreground mt-4">No transactions found</span>
                    </div> :
                    isMobile ?
                        <TransactionsCardView transactions={transactions} /> :
                        <TransactionsTableView transactions={transactions} />
            }
        </div>
    );
};
export default TransactionsPage;
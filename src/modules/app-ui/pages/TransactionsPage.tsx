import { EntityName } from "@/modules/app/entities/entities";
import type { Transaction } from "@/modules/app/entities/Transaction";
import { useDataSync } from "@/modules/data-sync/providers/DataSyncProvider";
import { useEffect, useState } from "react";
import { debounceTime, distinctUntilChanged, Subject } from "rxjs";
import TransactionsFilter, { type TransactionFilterOptions } from "../components/transactions/TransactionsFilter";
import TransactionsTable from "../components/transactions/TransactionsTable";

const TransactionsPage: React.FC = () => {

    const { orchestrator } = useDataSync();
    const [filter, setFilter] = useState<TransactionFilterOptions>({ sort: 'desc' });
    const [transactions, setTransactions] = useState<Array<Transaction> | null>(null);

    useEffect(() => {
        if (!orchestrator) return;
        const repo = orchestrator.repo(EntityName.Transaction);
        const filterSubject = new Subject<TransactionFilterOptions>();
        const subscription = filterSubject
            .pipe(debounceTime(300), distinctUntilChanged())
            .subscribe(async (filter) => {
                const query = {
                    sort: [{
                        field: 'transactionAt',
                        direction: filter.sort,
                    }],
                    years: filter.years,
                }
                return repo.observeAll(query).subscribe((data) => {
                    const transactions = data as Array<Transaction>;
                    console.log("Fetched transactions:", transactions);
                    setTransactions(transactions
                        .filter(t => !filter.accountIds || filter.accountIds.length == 0 || filter.accountIds.includes(t.accountId))
                        .filter(t => !filter.startDate || t.transactionAt >= filter.startDate!)
                        .filter(t => !filter.endDate || t.transactionAt <= filter.endDate!)
                        .filter(t => !filter.searchQuery || t.narration.toLowerCase().includes(filter.searchQuery.toLowerCase()))
                    );
                });
            });

        setTransactions(null);
        filterSubject.next(filter);
        return () => subscription.unsubscribe();
    }, [orchestrator, filter]);

    return (
        <div className="flex flex-col">
            <TransactionsFilter filter={filter} setFilter={setFilter} />
            <TransactionsTable transactions={transactions} />
        </div>
    );
};
export default TransactionsPage;
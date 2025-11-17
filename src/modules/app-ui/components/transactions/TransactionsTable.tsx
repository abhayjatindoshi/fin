import { EntityName } from "@/modules/app/entities/entities";
import type { MoneyAccount } from "@/modules/app/entities/MoneyAccount";
import type { Tag } from "@/modules/app/entities/Tag";
import type { Transaction } from "@/modules/app/entities/Transaction";
import { ImportHandler } from "@/modules/app/import/ImportHandler";
import EmptyOpenBox from "@/modules/base-ui/components/illustrations/EmptyOpenBox";
import { Button } from "@/modules/base-ui/components/ui/button";
import { Checkbox } from "@/modules/base-ui/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/modules/base-ui/components/ui/popover";
import { Separator } from "@/modules/base-ui/components/ui/separator";
import { Spinner } from "@/modules/base-ui/components/ui/spinner";
import { useDataSync } from "@/modules/data-sync/providers/DataSyncProvider";
import { withSync } from "@/modules/data-sync/ui/SyncedComponent";
import { BanknoteArrowDown, Hash } from "lucide-react";
import moment from "moment";
import { useEffect, useRef, useState } from "react";
import { Subject, debounceTime } from "rxjs";
import AccountNumber from "../../common/AccountNumber";
import Money from "../../common/Money";
import ImportIcon from "../../icons/import/ImportIcon";
import { useApp } from "../../providers/AppProvider";
import type { TransactionFilterOptions } from "./TransactionsFilter";

type TransactionsTableProps = {
    filter: TransactionFilterOptions
    accounts: Array<MoneyAccount>;
    tags: Array<Tag>;
}

const TransactionsTable: React.FC<TransactionsTableProps> = ({ filter, accounts }: TransactionsTableProps) => {

    const { orchestrator } = useDataSync();
    const { isMobile } = useApp();
    const adaptersMap = useRef(ImportHandler.getAllAdapterMeta());
    const [transactions, setTransactions] = useState<Array<Transaction> | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (!filter || !orchestrator) return;

        // Using RxJS for debouncing
        setLoading(true);
        const filterSubject = new Subject<TransactionFilterOptions>();
        const repo = orchestrator.repo(EntityName.Transaction);
        const subscription = filterSubject
            .pipe(debounceTime(300))
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
                    setLoading(false);
                    setTransactions(transactions
                        .filter(t => !filter.accountIds || filter.accountIds.length == 0 || filter.accountIds.includes(t.accountId))
                        .filter(t => !filter.startDate || t.transactionAt >= filter.startDate!)
                        .filter(t => !filter.endDate || t.transactionAt <= filter.endDate!)
                        .filter(t => !filter.searchQuery || t.narration.toLowerCase().includes(filter.searchQuery.toLowerCase()))
                    );
                });
            });

        filterSubject.next(filter);

        return () => {
            subscription.unsubscribe();
            filterSubject.complete();
        };
    }, [filter]);

    const BankIcon = (accountId: string) => {
        const account = accounts.find(a => a.id === accountId);
        if (!account) return null;
        const adapterMeta = adaptersMap.current[account.adapterName];
        if (!adapterMeta) return null;
        const Icon = ImportIcon[adapterMeta.display.icon];
        if (!Icon) return null;
        return <Popover>
            <PopoverTrigger asChild>
                <Icon className="size-5 text-muted-foreground" />
            </PopoverTrigger>
            <PopoverContent className="flex flex-row items-center py-2 px-3 justify-between w-48">
                <Icon className="size-8" />
                <div className="flex flex-col items-end">
                    <span className="uppercase font-semibold truncate">{adapterMeta.display.bankName}</span>
                    <span className="text-sm text-muted-foreground"><AccountNumber accountNumber={account.accountNumber} /></span>
                </div>
            </PopoverContent>
        </Popover>
    }

    const TransactionRow = (tx: Transaction, i: number) => {
        const DateCell = <div className="flex flex-col">
            <span className="text-sm">{moment(tx.transactionAt).format('MMM DD')}</span>
            <span className="text-xs text-muted-foreground">{moment(tx.transactionAt).format("'YY")}</span>
        </div>;
        const MoneyCell = <Money amount={tx.amount} />;
        const TagCell = <Button variant="secondary" size="sm" className="m-0" >
            {i % 2 == 0 ? <><Hash /> Tag</> : <><BanknoteArrowDown className="size-5" /> <span className="font-semibold text-xs">CASH WITHDRAWAL</span></>}
        </Button>;
        const DescriptionCell = <span className="text-muted-foreground">{tx.narration}</span>;
        const AccountIcon = BankIcon(tx.accountId);

        if (isMobile) {
            return <li key={tx.id} className="flex flex-col rounded-xl border">
                <div className="flex flex-row justify-between gap-3 px-3 py-1">
                    <div className="truncate">{DescriptionCell}</div>
                    <div className="shrink-0">{DateCell}</div>
                </div>
                <Separator />
                <div className="flex flex-row justify-between gap-3 p-3">
                    <div className="text-3xl">{MoneyCell}</div>
                    <div className="flex flex-row gap-3 items-center">
                        {TagCell}
                        <div>{AccountIcon}</div>
                    </div>
                </div>
            </li>
        }

        return <li key={tx.id} className="flex flex-row items-center gap-3 p-3 hover:bg-muted/50 first:rounded-t-xl last:rounded-b-xl border-b last:border-0">
            <Checkbox />
            <div className="w-24">{DateCell}</div>
            <div className="w-40 text-xl">{MoneyCell}</div>
            <div className="flex-1 truncate">{DescriptionCell}</div>
            <div className="w-48">{TagCell}</div>
            <div className="w-24">{AccountIcon}</div>
        </li>
    }

    if (loading) {
        return <Spinner className="m-auto justify-center" />;
    }

    if (!transactions || transactions.length === 0) {
        return <div className="flex flex-col items-center mt-12">
            <EmptyOpenBox className="mx-auto opacity-50 [&>svg]:size-12" animated={false} />
            <span className="text-muted-foreground mt-4">No transactions found</span>
        </div>;
    }

    const deleteAll = async () => {
        if (!orchestrator) return;
        const repo = orchestrator.repo(EntityName.Transaction);
        transactions
            .map(tx => tx.id)
            .filter(id => id != null)
            .forEach(repo.delete.bind(repo));
    }

    return <>
        <Button variant="destructive" size="sm" className="w-24" onClick={deleteAll}>Delete All</Button>
        <ul className={`flex flex-col ${isMobile ? 'gap-2 m-2' : 'my-4 border rounded-xl'}`}>
            {transactions && transactions.map(TransactionRow)}
        </ul>
    </>;
}

const synced = withSync(
    (orchestrator) => {
        const accounts = orchestrator.repo(EntityName.MoneyAccount).observeAll();
        const tags = orchestrator.repo(EntityName.Tag).observeAll();
        return { accounts, tags };
    },
    TransactionsTable
);
export default synced;
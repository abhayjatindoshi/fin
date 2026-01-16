import { TransactionService } from "@/modules/app/services/TransactionService";
import { Button } from "@/modules/base-ui/components/ui/button";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/modules/base-ui/components/ui/dropdown-menu";
import { Spinner } from "@/modules/base-ui/components/ui/spinner";
import { useDataSync } from "@/modules/data-sync/providers/DataSyncProvider";
import { ImportMatrix } from "@/modules/import/ImportMatrix";
import { ChevronDown, Landmark } from "lucide-react";
import moment from "moment";
import { useCallback, useEffect, useRef, useState } from "react";
import AccountNumber from "../../common/AccountNumber";
import { toRecord } from "../../common/ComponentUtils";
import { ImportIconComponent } from "../../icons/import/ImportIcon";
import { useEntity } from "../../providers/EntityProvider";
import BaseWidget from "./BaseWidget";

type TransactionCountData = {
    count: number;
    firstTransactionAt: Date | null;
    lastTransactionAt: Date | null;
}

const TransactionCountComponent: React.FC = () => {

    const { orchestrator } = useDataSync();
    const { accountMap } = useEntity();
    const service = useRef(new TransactionService());
    const [year, setYear] = useState<number | null>(null);
    const [accountId, setAccountId] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [data, setData] = useState<Record<string, TransactionCountData> | null>(null);

    const accountsMetaMap = toRecord(Object.values(accountMap ?? {}).map(account => {
        const bank = ImportMatrix.Banks[account.bankId];
        const offering = bank?.offerings?.find(o => o.id === account.offeringId);
        return { id: account.id, account, bank, offering };
    }), 'id');

    const fetchData = useCallback(async () => {
        if (!year || !orchestrator) return;
        setLoading(true);
        try {
            const transactions = await service.current.getTransactionsForYear(year!);
            const filteredTransactions = accountId ?
                transactions.filter(t => t.accountId === accountId) :
                transactions;

            const groupedData = filteredTransactions.reduce((obj, transaction) => {
                const month = moment(transaction.transactionAt).format('MMM \'YY');
                if (!obj[month]) obj[month] = { count: 0, firstTransactionAt: null, lastTransactionAt: null };
                obj[month].count += 1;
                obj[month].firstTransactionAt = obj[month].firstTransactionAt ? new Date(Math.min(obj[month].firstTransactionAt.getTime(), new Date(transaction.transactionAt).getTime())) : new Date(transaction.transactionAt);
                obj[month].lastTransactionAt = obj[month].lastTransactionAt ? new Date(Math.max(obj[month].lastTransactionAt.getTime(), new Date(transaction.transactionAt).getTime())) : new Date(transaction.transactionAt);
                return obj;
            }, {} as Record<string, TransactionCountData>);
            setData(groupedData);
        } finally {
            setLoading(false);
        }
    }, [year, orchestrator, accountId]);

    useEffect(() => {
        if (!orchestrator) return;
        service.current.getCurrentYear().then(setYear);
    }, [orchestrator, service.current]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return <div className="rounded-lg flex flex-col items-center justify-center gap-4 overflow-auto">
        <div className="flex flex-row gap-2 items-center justify-between">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="self-end">
                        {year === null ? <Spinner /> : year} <ChevronDown />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-secondary/50 backdrop-blur-xs">
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                        <DropdownMenuCheckboxItem key={y} checked={year === y} onSelect={() => setYear(y)}>{y}</DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className=''>
                        {accountId ?
                            <>
                                <ImportIconComponent name={accountsMetaMap[accountId]?.bank?.display?.icon ?? ''} />
                                <AccountNumber accountNumber={accountsMetaMap[accountId]?.account.accountNumber} />
                            </> :
                            <><Landmark /> All accounts</>
                        }
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className={`w-64 `}>
                    <DropdownMenuItem key={'all-accounts'} onClick={() => setAccountId(null)}>
                        <div className="flex flex-row gap-4 items-center">
                            <Landmark className="size-4 mx-1" /> All accounts
                        </div>
                    </DropdownMenuItem>
                    {Object.values(accountsMetaMap).map(({ account, bank }) => (
                        <DropdownMenuItem key={account.id} onClick={() => setAccountId(account.id ?? null)}>
                            <div className="flex flex-row gap-4 items-center">
                                <ImportIconComponent name={bank?.display?.icon ?? ''} className="size-6" />
                                <div className="flex flex-col gap-1">
                                    <span className="uppercase">{bank?.display?.name ?? ''}</span>
                                    <span className="text-sm text-muted-foreground"><AccountNumber accountNumber={account.accountNumber} /></span>
                                </div>
                            </div>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
            {loading && <Spinner />}
        </div>
        <div className="flex flex-row">
            {data ? Object.entries(data).map(([month, transactions]) => (
                <div key={month} className="flex flex-col items-center mx-2">
                    <span className="font-semibold">{month}</span>
                    <span className="text-2xl">{transactions.count}</span>
                    <span className="text-xs">{moment(transactions.firstTransactionAt).format('MMM D')}</span>
                    <span className="text-xs">{moment(transactions.lastTransactionAt).format('MMM D')}</span>
                </div>
            )) : <Spinner />}
            <div key="all" className="flex flex-col items-center mx-2">
                <span className="font-semibold">Total</span>
                <span className="text-2xl">{data ? Object.values(data).reduce((sum, transactions) => sum + transactions.count, 0) : <Spinner />}</span>
            </div>
        </div>
    </div>;
}

const TransactionCountWidget: React.FC = () => {
    return <BaseWidget
        WidgetComponent={TransactionCountComponent}
        resizeable={true} size={{
            default: { width: 20, height: 10 },
            min: { width: 20, height: 10 }
        }}
    />;
}

export default TransactionCountWidget;
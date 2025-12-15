import { TransactionService } from "@/modules/app/services/TransactionService";
import { Button } from "@/modules/base-ui/components/ui/button";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/modules/base-ui/components/ui/dropdown-menu";
import { Spinner } from "@/modules/base-ui/components/ui/spinner";
import { useDataSync } from "@/modules/data-sync/providers/DataSyncProvider";
import { ArrowDown, ArrowUp, ChevronDown } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import Money from "../../common/Money";
import BaseWidget from "./BaseWidget";

const MoneyFlowComponent: React.FC = () => {

    const { orchestrator } = useDataSync();
    const service = useRef(new TransactionService());
    const [year, setYear] = useState<number | null>(null);
    const [moneyIn, setMoneyIn] = useState<number | null>(0);
    const [moneyOut, setMoneyOut] = useState<number | null>(0);

    const fetchData = useCallback(async () => {
        let totalIn = 0;
        let totalOut = 0;

        if (!year) return;
        const transactions = await service.current.getTransactionsForYear(year!);
        transactions.forEach(t => {
            if (t.amount > 0) {
                totalIn += t.amount;
            } else {
                totalOut += t.amount;
            }
        });

        setMoneyIn(totalIn);
        setMoneyOut(totalOut);

    }, [year]);

    useEffect(() => {
        if (!orchestrator) return;
        service.current.getCurrentYear().then(setYear);
    }, [orchestrator, service.current]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (moneyIn === null || moneyOut === null) return <Spinner />;

    return <div className="rounded-lg flex flex-col items-center justify-center gap-4">
        <div className="flex flex-row gap-2 items-center justify-between">
            <span className="text-xl font-semibold">Cash flow</span>
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
        </div>
        <span className="flex flex-row items-center gap-2 text-2xl">
            <ArrowUp className="text-green-500 size-8" />
            <Money amount={moneyIn} />
        </span>
        <span className="flex flex-row items-center gap-2 text-2xl">
            <ArrowDown className="text-red-500 size-8" />
            <Money amount={moneyOut} />
        </span>
    </div>;
}

const MoneyFlowWidget: React.FC = () => {
    return <BaseWidget
        WidgetComponent={MoneyFlowComponent}
        resizeable={true}
    />;
}

export default MoneyFlowWidget;
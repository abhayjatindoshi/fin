import { EntityName, util } from "@/modules/app/entities/entities";
import type { Transaction } from "@/modules/app/entities/Transaction";
import { Button } from "@/modules/base-ui/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/modules/base-ui/components/ui/dropdown-menu";
import { Spinner } from "@/modules/base-ui/components/ui/spinner";
import type { QueryOptions } from "@/modules/data-sync/interfaces/QueryOptions";
import type { EntityNameOf } from "@/modules/data-sync/interfaces/types";
import { useDataSync } from "@/modules/data-sync/providers/DataSyncProvider";
import type { DateStrategyOptions } from "@/modules/data-sync/strategies/EntityKeyDateStrategy";
import { ArrowDown, ArrowUp, ChevronDown } from "lucide-react";
import moment from "moment";
import { useCallback, useEffect, useState } from "react";
import Money from "../../common/Money";
import { useApp } from "../../providers/AppProvider";
import BaseWidget from "./BaseWidget";

const MoneyFlowComponent: React.FC = () => {

    const { orchestrator } = useDataSync();
    const { settings } = useApp();
    const [year, setYear] = useState<number>(new Date().getFullYear());
    const [moneyIn, setMoneyIn] = useState<number | null>(0);
    const [moneyOut, setMoneyOut] = useState<number | null>(0);

    const fetchData = useCallback(async () => {
        if (!orchestrator || !settings) return;
        const firstMonth = parseInt(settings["calendar.firstMonth"]);
        if (isNaN(firstMonth)) return;
        const today = new Date();
        if (firstMonth > today.getMonth()) {
            setYear(today.getFullYear() - 1);
        }

        const startDate = moment().year(year).month(firstMonth).startOf('month');
        const endDate = startDate.clone().add(11, 'months').endOf('month');

        const years = Array.from({ length: endDate.year() - startDate.year() + 1 }, (_, i) => startDate.year() + i);

        let totalIn = 0;
        let totalOut = 0;

        const query = { years } as QueryOptions<typeof util, EntityNameOf<typeof util>> & { dateStrategyOptions?: DateStrategyOptions };
        const repo = orchestrator.repo(EntityName.Transaction);
        const transactions = await repo.getAll(query) as Array<Transaction>;
        transactions
            .filter(t => t.transactionAt >= startDate.toDate() && t.transactionAt <= endDate.toDate())
            .forEach(t => {
                if (t.amount > 0) {
                    totalIn += t.amount;
                } else {
                    totalOut += t.amount;
                }
            });

        setMoneyIn(totalIn);
        setMoneyOut(totalOut);

    }, [orchestrator, year, settings]);

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
                        {year} <ChevronDown />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-secondary/50 backdrop-blur-xs">
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <DropdownMenuItem key={year} onSelect={() => setYear(year)}>{year}</DropdownMenuItem>
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
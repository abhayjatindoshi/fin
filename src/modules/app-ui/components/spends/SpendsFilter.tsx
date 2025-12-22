import { TransactionService } from "@/modules/app/services/TransactionService";
import { Button } from "@/modules/base-ui/components/ui/button";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/modules/base-ui/components/ui/dropdown-menu";
import { useDataSync } from "@/modules/data-sync/providers/DataSyncProvider";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef } from "react";
import { useApp } from "../../providers/AppProvider";

export type SpendFilterOptions = {
    year: number;
}

type SpendFilterProps = {
    filter: SpendFilterOptions | undefined;
    setFilter: (props: SpendFilterOptions) => void;
}

const SpendsFilter: React.FC<SpendFilterProps> = ({ filter, setFilter }) => {

    const { isMobile } = useApp();
    const { orchestrator } = useDataSync();
    const transactionService = useRef(new TransactionService()).current;

    // set current year as default
    useEffect(() => {
        if (!orchestrator) return;
        transactionService.getCurrentYear().then(year => setFilter({ year }));
    }, [orchestrator]);

    if (!filter) return null;

    return <div className={`flex flex-row justify-end w-full sticky z-10 ${isMobile ? 'p-4 top-0' : 'top-20'}`}>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="bg-secondary/50 backdrop-blur border font-light">
                    {filter.year} <ChevronDown />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-secondary/50 backdrop-blur border font-light">
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                    <DropdownMenuCheckboxItem key={y} checked={filter.year === y} onSelect={() => setFilter({ year: y })}>{y}</DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
}

export default SpendsFilter;
import { EntityUtils, TransactionDateFilterOptions } from "@/modules/app/common/EntityUtils";
import { EntityName } from "@/modules/app/entities/entities";
import type { MoneyAccount } from "@/modules/app/entities/MoneyAccount";
import { ImportHandler } from "@/modules/app/import/ImportHandler";
import type { SettingKeys } from "@/modules/app/services/SettingService";
import { Button } from "@/modules/base-ui/components/ui/button";
import { Calendar as CalendarComponent } from "@/modules/base-ui/components/ui/calendar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/modules/base-ui/components/ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/modules/base-ui/components/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/modules/base-ui/components/ui/popover";
import { withSync } from "@/modules/data-sync/ui/SyncedComponent";
import { ArrowDownWideNarrow, ArrowUpNarrowWide, Calendar as CalendarIcon, ChevronRight, Landmark, Search } from "lucide-react";
import moment from "moment";
import { useRef, useState } from "react";
import { type DateRange } from "react-day-picker";
import AccountNumber from "../../common/AccountNumber";
import ImportIcon from "../../icons/import/ImportIcon";
import { useApp } from "../../providers/AppProvider";

export type TransactionFilterOptions = {
    years?: number[];
    startDate?: Date;
    endDate?: Date;
    accountIds?: string[];
    sort: 'asc' | 'desc';
    searchQuery?: string;
}

export const getDefaultOptions = (settings: Record<SettingKeys, string> | null): TransactionFilterOptions => {
    if (!settings) {
        return { sort: 'desc' };
    }

    const result = EntityUtils.parseTransactionDateFilter('this_year', settings);

    return {
        startDate: result.startDate,
        endDate: result.endDate,
        sort: 'desc',
    };
}

type TransactionsFilterProps = {
    accounts?: Array<MoneyAccount>;
    filter: TransactionFilterOptions;
    setFilter: (props: TransactionFilterOptions) => void;
}

const TransactionsFilter: React.FC<TransactionsFilterProps> = ({ accounts, filter, setFilter }: TransactionsFilterProps) => {

    const adaptersMap = useRef(ImportHandler.getAllAdapterMeta());
    const [timestampLabel, setTimestampLabel] = useState<string>('This year');
    const { isMobile, settings } = useApp();
    const [showSearch, setShowSearch] = useState<boolean>(!isMobile);
    const blurClasses = 'bg-secondary/50 backdrop-blur border';

    const setSort = (sort: 'asc' | 'desc') => {
        setFilter({ ...filter, sort });
    }

    const setAccountId = (accountId: string) => {
        setFilter({ ...filter, accountIds: [accountId] });
    }

    const setDate = (obj: { startDate: Date, endDate?: Date }) => {
        let label = moment(obj.startDate).format('MMM D, YYYY');
        if (obj.endDate) {
            label += ` to ${moment(obj.endDate).format('MMM D, YYYY')}`;
        }
        setTimestampLabel(label);

        const currentYear = moment(obj.startDate).year();
        const endYear = obj.endDate ? moment(obj.endDate).year() : currentYear;
        const years = Array.from({ length: endYear - currentYear + 1 }, (_, i) => currentYear + i);

        setFilter({ ...filter, startDate: obj.startDate, endDate: obj.endDate, years });
    }

    const setDateFilter = (key: string) => {
        if (!settings) return;
        const result = EntityUtils.parseTransactionDateFilter(key as keyof typeof TransactionDateFilterOptions, settings);
        setDate(result);
        setTimestampLabel(result.label);
    }

    const setSearch = (term: string) => {
        setFilter({ ...filter, searchQuery: term });
    }

    const AdapterIcon = (icon: string, props?: React.SVGProps<SVGSVGElement>) => {
        const IconComponent = ImportIcon[icon];
        if (!IconComponent) return null;
        return <IconComponent {...props} />;
    }

    const SortDropdown = () => {
        return <Button variant="outline"
            className={`font-light ${blurClasses}`}
            onClick={() => setSort(filter.sort === 'desc' ? 'asc' : 'desc')}>
            {filter.sort === 'desc' ?
                (<> <ArrowDownWideNarrow /> Newest first</>) :
                (<> <ArrowUpNarrowWide /> Oldest first</>)
            }
        </Button>
    };

    const AccountsDropdown = () => {
        if (!accounts) return null;

        const transformAccountsForDisplay = (accounts: MoneyAccount[]) => {
            return accounts
                .filter(a => adaptersMap.current[a.adapterName])
                .filter(a => a.id !== undefined)
                .map(account => ({
                    id: account.id!,
                    accountNumber: account.accountNumber,
                    bankName: adaptersMap.current[account.adapterName].display.bankName,
                    bankIcon: adaptersMap.current[account.adapterName].display.icon,
                }));
        }

        const selectedAccounts = transformAccountsForDisplay(filter.accountIds
            ?.map(id => accounts.find(a => a.id === id))
            .filter(a => a !== undefined) ?? []);
        const displayAccounts = transformAccountsForDisplay(accounts);

        return <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className={`font-light ${blurClasses}`}>
                    {selectedAccounts.length > 0 ?
                        <>{AdapterIcon(selectedAccounts[0].bankIcon)} <AccountNumber accountNumber={selectedAccounts[0].accountNumber} />   </> :
                        <><Landmark /> All accounts</>
                    }
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64">
                <DropdownMenuItem key={'all-accounts'} onClick={() => setFilter({ ...filter, accountIds: [] })}>
                    <div className="flex flex-row gap-4 items-center">
                        <Landmark className="size-4 mx-1" /> All accounts
                    </div>
                </DropdownMenuItem>
                {displayAccounts.map(account => (
                    <DropdownMenuItem key={account.id} onClick={() => setAccountId(account.id)}>
                        <div className="flex flex-row gap-4 items-center">
                            {AdapterIcon(account.bankIcon, { className: 'size-6' })}
                            <div className="flex flex-col gap-1">
                                <span className="uppercase">{account.bankName}</span>
                                <span className="text-sm text-muted-foreground"><AccountNumber accountNumber={account.accountNumber} /></span>
                            </div>
                        </div>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    }

    const TimelineDropdown = () => {
        const [mode, setMode] = useState<'date-tag' | 'custom-range'>('date-tag');
        const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>(undefined);

        return <Popover onOpenChange={() => setMode('date-tag')}>
            <PopoverTrigger asChild>
                <Button variant="outline" className={`font-light ${blurClasses}`}>
                    <CalendarIcon />{timestampLabel}
                </Button>
            </PopoverTrigger>
            <PopoverContent className={`p-0 flex flex-col ${mode == 'date-tag' ? 'w-42' : 'w-64'}`}>
                {mode === 'date-tag' ? <>
                    {Object.entries(TransactionDateFilterOptions).map(([key, label]) => (
                        <Button key={key} variant="ghost" className="flex flex-row justify-start uppercase" onClick={() => setDateFilter(key)}>
                            {label}
                        </Button>
                    ))}
                    <Button variant="ghost" className="flex flex-row justify-start uppercase" onClick={() => setMode('custom-range')}>
                        <span>Custom Range</span>
                        <ChevronRight />
                    </Button>
                </> : <>
                    <CalendarComponent mode="range"
                        selected={selectedDateRange}
                        onSelect={setSelectedDateRange} />
                    <div className="flex flex-row gap-2 m-2">
                        <Button variant="ghost" className="flex-grow" onClick={() => setMode('date-tag')}>Back</Button>
                        <Button variant="default" className="flex-grow"
                            disabled={!selectedDateRange || !selectedDateRange.from || !selectedDateRange.to}
                            onClick={() => setDate({ startDate: selectedDateRange!.from!, endDate: selectedDateRange!.to! })}>
                            Apply
                        </Button>
                    </div>
                </>}
            </PopoverContent>
        </Popover>
    }

    const SearchBar = () => {
        return <>
            {isMobile && !showSearch && <Button variant="outline" size="icon-sm" className={`relative ${blurClasses}`} onClick={() => setShowSearch(true)}>
                <Search />
                {filter.searchQuery && filter.searchQuery.length > 0 && <span className="size-2 rounded-full bg-accent absolute top-2 right-2"></span>}
            </Button>}
            {showSearch && <InputGroup className={`${isMobile ? 'w-full' : 'w-48'} ${blurClasses}`}>
                <InputGroupInput autoFocus={isMobile}
                    className="pr-2" placeholder="Search..."
                    value={filter.searchQuery}
                    onBlur={() => setShowSearch(isMobile ? false : true)}
                    onChange={e => setSearch(e.target.value)} />
                <InputGroupAddon>
                    <Search />
                </InputGroupAddon>
            </InputGroup>}
        </>
    }

    return <div className={`flex flex-row flex-wrap items-center gap-2 sticky z-10
    ${isMobile ? 'px-4 py-0 h-16 top-0' : 'top-20'}`}>
        {(!isMobile || !showSearch) && <>
            <SortDropdown />
            <AccountsDropdown />
            <TimelineDropdown />
        </>}
        <div className="flex-1" />
        <SearchBar />
    </div>;
}

const synced = withSync(
    (orchestrator) => {
        const repo = orchestrator.repo(EntityName.MoneyAccount);
        const accounts = repo.observeAll();
        return { accounts };
    },
    TransactionsFilter
);

export default synced;
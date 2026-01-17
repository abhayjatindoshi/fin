import type { MoneyAccount } from "@/modules/app/entities/MoneyAccount";
import { Button } from "@/modules/base-ui/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/modules/base-ui/components/ui/input-group";
import { Search } from "lucide-react";
import moment from "moment";
import { useMemo, useState } from "react";
import { useApp } from "../../providers/AppProvider";
import AccountFilter from "./filters/AccountFilter";
import DateSort from "./filters/DateSort";
import TagToggle, { type TagToggleOptions } from "./filters/TagToggle";
import type { Timeline } from "./filters/TimelineFilter";
import TimelineFilter from "./filters/TimelineFilter";

export type TransactionFilterOptions = {
    years?: number[];
    startDate?: Date;
    endDate?: Date;
    accountIds?: string[];
    sort: 'asc' | 'desc';
    searchQuery?: string;
    tags?: TagToggleOptions;
}

type TransactionsFilterProps = {
    accounts?: Array<MoneyAccount>;
    filter: TransactionFilterOptions;
    setFilter: (props: TransactionFilterOptions) => void;
}

const TransactionsFilter: React.FC<TransactionsFilterProps> = ({ filter, setFilter }: TransactionsFilterProps) => {

    const { isMobile } = useApp();
    const [showSearchOverlay, setShowSearchOverlay] = useState<boolean>(false);
    const [timeline, setTimeline] = useState<Timeline | null>(null);
    const blurClasses = 'bg-secondary/50 backdrop-blur border font-light';

    const setSort = (sort: 'asc' | 'desc') => {
        setFilter({ ...filter, sort });
    }

    const setAccountId = (accountId: string | null) => {
        if (!accountId) {
            setFilter({ ...filter, accountIds: [] });
        } else {
            setFilter({ ...filter, accountIds: [accountId] });
        }
    }

    const setTimelineFilter = (timeline: Timeline) => {
        setTimeline(timeline);
        const currentYear = moment(timeline.from).year();
        const endYear = timeline.to ? moment(timeline.to).year() : currentYear;
        const years = Array.from({ length: endYear - currentYear + 1 }, (_, i) => currentYear + i);
        setFilter({ ...filter, startDate: timeline.from, endDate: timeline.to, years });
    }

    const setTagToggle = (tags: TagToggleOptions | undefined) => {
        setFilter({ ...filter, tags });
    }

    const setSearchFilter = (term: string) => {
        setFilter({ ...filter, searchQuery: term });
    }

    const SearchBar = useMemo(() => ({ autoFocus, onClick, search, setSearch }: { autoFocus?: boolean; onClick?: () => void; search?: string; setSearch?: (term: string) => void }) => {

        return <InputGroup className={`${isMobile ? 'flex-1' : 'w-48'} ${blurClasses}`}>
            <InputGroupInput autoFocus={autoFocus}
                onClick={onClick}
                className="pr-2" placeholder="Search..."
                value={search}
                onChange={e => setSearch?.(e.target.value)} />
            <InputGroupAddon>
                <Search />
            </InputGroupAddon>
        </InputGroup>
    }, []);

    const enableSearchOverlay = (currentFilter: TransactionFilterOptions) => {
        setFilter(currentFilter);
        setShowSearchOverlay(true);
    }

    const SearchOverlay = () => {

        const [overlayFilter, setOverlayFilter] = useState<TransactionFilterOptions>({ ...filter });

        const applyFilter = () => {
            setFilter(overlayFilter);
            setShowSearchOverlay(false);
        }

        return <div className={`absolute top-0 left-0 h-full w-full ${blurClasses} ${showSearchOverlay ? 'flex' : 'hidden'} flex-col gap-2 items-center p-4 z-20`}>
            <div className="flex flex-row gap-2 w-full">
                <SearchBar autoFocus search={overlayFilter.searchQuery} setSearch={term => setOverlayFilter({ ...overlayFilter, searchQuery: term })} />
                <Button variant="ghost" onClick={applyFilter}>Apply</Button>
            </div>
            <div className="flex flex-row gap-2 justify-start w-full overflow-auto">
                <DateSort sort={overlayFilter.sort} setSort={sort => setOverlayFilter({ ...overlayFilter, sort })} />
                <AccountFilter accountId={overlayFilter.accountIds?.[0] ?? null}
                    setAccountId={accountId => { setOverlayFilter({ ...overlayFilter, accountIds: accountId ? [accountId] : [] }) }} />
                <TagToggle toggle={filter.tags} setToggle={setTagToggle} />
            </div>
        </div>
    }

    if (isMobile) {
        return <>
            <div className="flex flex-row items-center gap-2 sticky z-10 p-4 top-0">
                <SearchBar search={filter.searchQuery} onClick={() => enableSearchOverlay(filter)} />
                <TimelineFilter timeline={timeline} setTimeline={setTimelineFilter} className={blurClasses} dropdownClassName={blurClasses} />
            </div>
            <SearchOverlay />
        </>;
    }

    return <div className="flex flex-row flex-wrap items-center gap-2 sticky z-10 top-20">
        <DateSort sort={filter.sort} setSort={setSort} className={blurClasses} />
        <AccountFilter accountId={filter.accountIds?.[0] ?? null} setAccountId={setAccountId} className={blurClasses} dropdownClassName={blurClasses} />
        <TimelineFilter timeline={timeline} setTimeline={setTimelineFilter} className={blurClasses} dropdownClassName={blurClasses} />
        <TagToggle toggle={filter.tags} setToggle={setTagToggle} className={blurClasses} />
        <div className="flex-1" />
        <SearchBar search={filter.searchQuery} setSearch={setSearchFilter} />
    </div>;
}

export default TransactionsFilter;
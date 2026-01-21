import { useApp } from "@/modules/app-ui/providers/AppProvider";
import { EntityUtils, TransactionDateFilterOptions } from "@/modules/app/common/EntityUtils";
import { Button } from "@/modules/base-ui/components/ui/button";
import { Calendar } from "@/modules/base-ui/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/modules/base-ui/components/ui/popover";
import { CalendarIcon, ChevronRight } from "lucide-react";
import moment from "moment";
import { useCallback, useEffect, useState } from "react";
import { type DateRange } from "react-day-picker";

export type Timeline = {
    from: Date;
    to?: Date;
    key?: keyof typeof TransactionDateFilterOptions;
    label: string;
    hint?: string;
}

type TimelineFilterProps = {
    timeline: Timeline | null;
    setTimeline: (timeline: Timeline) => void;
    loadMoreRef?: React.RefObject<(() => void) | null>;
    className?: string;
    dropdownClassName?: string;
}

const TimelineFilter: React.FC<TimelineFilterProps> = ({ timeline, setTimeline, loadMoreRef, className, dropdownClassName }) => {

    const { settings } = useApp();
    const [open, setOpen] = useState<boolean>(false);
    const [mode, setMode] = useState<'date-tag' | 'year' | 'custom-range'>('date-tag');
    const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>(undefined);

    const setDateTag = (key: keyof typeof TransactionDateFilterOptions) => {
        if (!settings) return;
        const result = EntityUtils.parseTransactionDateFilter(key, settings);

        setTimeline({
            from: result.startDate,
            to: result.endDate,
            key,
            label: result.label,
            hint: result.hint
        });
        setOpen(false);
    }

    const setYear = (year: number) => {
        if (!settings) return;
        const result = EntityUtils.parseTransactionYear(year, settings);

        setTimeline({
            from: result.startDate,
            to: result.endDate,
            label: result.label,
            hint: result.hint
        });
        setOpen(false);
    }

    const setCustomRange = (range: DateRange | undefined) => {
        if (!range || !range.from) return;
        let label = moment(range.from).format('MMM D, YYYY');
        if (range.to) {
            label += ` to ${moment(range.to).format('MMM D, YYYY')}`;
        }
        setTimeline({
            from: range.from,
            to: range.to,
            label: label
        });
        setOpen(false);
        setMode('date-tag');
    }

    const loadMore = useCallback(() => {
        if (!timeline) return;
        const option = TransactionDateFilterOptions[timeline.key ?? 'this_month'] ?? TransactionDateFilterOptions['this_month'];
        const addUnits = option.addUnit;
        const addUnitDuration = option.addUnitDuration;
        timeline.from = moment(timeline.from).subtract(addUnits, addUnitDuration).toDate();
        setTimeline({ ...timeline });
    }, [timeline])

    if (loadMoreRef) {
        loadMoreRef.current = loadMore;
    }

    useEffect(() => {
        if (!settings) return;
        if (timeline == null) {
            setDateTag('today');
        }
    }, [timeline, settings]);

    if (timeline == null) {
        return null;
    }

    return <Popover open={open} onOpenChange={(open) => { setOpen(open); setMode('date-tag'); }}>
        <PopoverTrigger asChild>
            <Button variant="outline" className={className}>
                <CalendarIcon />{timeline.label} {timeline.hint ? ` (${timeline.hint})` : ''}
            </Button>
        </PopoverTrigger>
        <PopoverContent className={`p-0 flex flex-col ${mode == 'date-tag' ? 'w-42' : 'w-64'} ${dropdownClassName}`}>
            {mode === 'date-tag' && <>
                {Object.entries(TransactionDateFilterOptions).map(([key, option]) => (
                    <Button key={key}
                        variant="ghost"
                        className="flex flex-row justify-start uppercase"
                        onClick={() => setDateTag(key as keyof typeof TransactionDateFilterOptions)}>
                        {option.label}
                    </Button>
                ))}
                <Button variant="ghost" className="flex flex-row justify-start uppercase w-full" onClick={() => setMode('year')}>
                    <span>Select year</span>
                    <div className="flex-1" />
                    <ChevronRight />
                </Button>
                <Button variant="ghost" className="flex flex-row justify-start uppercase w-full" onClick={() => setMode('custom-range')}>
                    <span>Custom Range</span>
                    <div className="flex-1" />
                    <ChevronRight />
                </Button>
            </>}
            {mode === 'year' && <>
                <div className="flex flex-row flex-wrap">
                    {Array.from({ length: 10 }, (_, i) => {
                        const year = moment().year() - i;
                        return (<Button key={year}
                            variant="ghost"
                            className="flex-grow m-1"
                            onClick={() => setYear(year)}>
                            {year}
                        </Button>);
                    })}
                </div>
            </>}
            {mode == 'custom-range' && <>
                <Calendar mode="range"
                    selected={selectedDateRange}
                    onSelect={setSelectedDateRange} />
                <div className="flex flex-row gap-2 m-2">
                    <Button variant="ghost" className="flex-grow" onClick={() => setMode('date-tag')}>Back</Button>
                    <Button variant="default" className="flex-grow"
                        disabled={!selectedDateRange || !selectedDateRange.from || !selectedDateRange.to}
                        onClick={() => setCustomRange(selectedDateRange)}>
                        Apply
                    </Button>
                </div>
            </>}
        </PopoverContent>
    </Popover>
};

export default TimelineFilter;
import { useApp } from "@/modules/app-ui/providers/AppProvider";
import { EntityUtils, TransactionDateFilterOptions } from "@/modules/app/common/EntityUtils";
import { Button } from "@/modules/base-ui/components/ui/button";
import { Calendar } from "@/modules/base-ui/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/modules/base-ui/components/ui/popover";
import { CalendarIcon, ChevronRight } from "lucide-react";
import moment from "moment";
import { useEffect, useState } from "react";
import { type DateRange } from "react-day-picker";

export type Timeline = {
    from: Date;
    to?: Date;
    label: string;
    hint?: string;
}

type TimelineFilterProps = {
    timeline: Timeline | null;
    setTimeline: (timeline: Timeline) => void;
    className?: string;
    dropdownClassName?: string;
}

const TimelineFilter: React.FC<TimelineFilterProps> = ({ timeline, setTimeline, className, dropdownClassName }) => {

    const { settings } = useApp();
    const [open, setOpen] = useState<boolean>(false);
    const [mode, setMode] = useState<'date-tag' | 'custom-range'>('date-tag');
    const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>(undefined);

    const setDateTag = (key: keyof typeof TransactionDateFilterOptions) => {
        if (!settings) return;
        const result = EntityUtils.parseTransactionDateFilter(key, settings);

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
            {mode === 'date-tag' ? <>
                {Object.entries(TransactionDateFilterOptions).map(([key, label]) => (
                    <Button key={key}
                        variant="ghost"
                        className="flex flex-row justify-start uppercase"
                        onClick={() => setDateTag(key as keyof typeof TransactionDateFilterOptions)}>
                        {label}
                    </Button>
                ))}
                <Button variant="ghost" className="flex flex-row justify-start uppercase" onClick={() => setMode('custom-range')}>
                    <span>Custom Range</span>
                    <ChevronRight />
                </Button>
            </> : <>
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
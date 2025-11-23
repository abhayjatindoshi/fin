import { Button } from "@/modules/base-ui/components/ui/button";
import { ArrowDownWideNarrow, ArrowUpNarrowWide } from "lucide-react";

type DateSortProps = {
    sort: 'asc' | 'desc';
    setSort: (sort: 'asc' | 'desc') => void;
    className?: string;
};

const DateSort: React.FC<DateSortProps> = ({ sort, setSort, className }) => {
    return <Button variant="outline"
        className={className}
        onClick={() => setSort(sort === 'desc' ? 'asc' : 'desc')}>
        {sort === 'desc' ?
            (<> <ArrowDownWideNarrow /> Newest first</>) :
            (<> <ArrowUpNarrowWide /> Oldest first</>)
        }
    </Button>
};

export default DateSort;
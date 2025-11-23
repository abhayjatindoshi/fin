import moment from "moment";
import type React from "react";

type DateCellProps = {
    date: Date;
    className?: string;
};

const DateCell: React.FC<DateCellProps> = ({ date, className }) => {

    const dateObj = moment(date);

    return <div className={className}>
        <span className="text-sm">{dateObj.format('MMM DD')} </span>
        <span className="text-xs text-muted-foreground">{dateObj.format("'YY")}</span>
    </div>;
};

export default DateCell;
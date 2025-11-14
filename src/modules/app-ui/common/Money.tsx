import { IndianRupee, Minus, Plus } from "lucide-react";

const Money = ({ amount }: { amount: number }) => {

    const Currency = <IndianRupee className="size-4 mb-2" />
    const Symbol = amount < 0 ?
        <Minus className="size-3 text-muted-foreground" /> :
        <Plus className="size-3 text-muted-foreground" />;

    return <div className="flex flex-row items-center">
        <span>{Symbol}</span>
        <span>{Currency}</span>
        <span className="truncate">{Intl.NumberFormat().format(Math.abs(amount))}</span>
    </div>;
}

export default Money;
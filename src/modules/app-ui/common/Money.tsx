import { Minus, Plus } from "lucide-react";
import { useApp } from "../providers/AppProvider";
import Currency from "./Currency";

const Money = ({ amount }: { amount: number }) => {

    const { settings } = useApp();
    const currency = settings?.['transaction.defaultCurrencyCode'] ?? 'INR';

    const Symbol = amount < 0 ?
        <Minus className="size-3 text-muted-foreground" /> :
        <Plus className="size-3 text-muted-foreground" />;

    return <div className="flex flex-row items-center">
        <span>{Symbol}</span>
        <span><Currency code={currency} variant="icon" /></span>
        <span className="truncate">{Intl.NumberFormat().format(Math.abs(amount))}</span>
    </div>;
}

export default Money;
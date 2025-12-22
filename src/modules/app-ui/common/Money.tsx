import { Minus, Plus } from "lucide-react";
import { useApp } from "../providers/AppProvider";
import Currency, { CurrencyCode } from "./Currency";

type MoneyProps = {
    amount: number;
    sign?: boolean;
    className?: string;
}

const Money: React.FC<MoneyProps> = ({ amount, sign = true, className }) => {

    const { settings } = useApp();
    const currency = settings?.['transaction.defaultCurrencyCode'] ?? 'INR';

    const Symbol = amount < 0 ?
        <Minus className="size-3 text-muted-foreground" /> :
        <Plus className="size-3 text-muted-foreground" />;

    return <div className={`flex flex-row items-center ${className}`}>
        {sign && <span>{Symbol}</span>}
        <span><Currency code={currency} variant="icon" className="size-3 mb-2" /></span>
        <span className="truncate">{Intl.NumberFormat(CurrencyCode[currency].locale).format(Math.abs(amount))}</span>
    </div>;
}

export default Money;
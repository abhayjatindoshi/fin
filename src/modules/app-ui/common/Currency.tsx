import { DollarSign, Euro, GeorgianLari, IndianRupee, JapaneseYen, PhilippinePeso, PoundSterling, RussianRuble, SaudiRiyal, SwissFranc, TurkishLira } from "lucide-react";
import type { ReactNode } from "react";
import { toRecord } from "./ComponentUtils";

export type CurrencyDetails = {
    code: string;
    name: string;
    symbolStr: string;
    icon: ReactNode;
}

const CurrencyCodeList: Array<CurrencyDetails> = [
    { code: 'INR', name: 'Indian Rupee', symbolStr: '₹', icon: <IndianRupee /> },
    { code: 'USD', name: 'United States Dollar', symbolStr: '$', icon: <DollarSign /> },
    { code: 'EUR', name: 'Euro', symbolStr: '€', icon: <Euro /> },
    { code: 'GBP', name: 'British Pound Sterling', symbolStr: '£', icon: <PoundSterling /> },
    { code: 'JPY', name: 'Japanese Yen', symbolStr: '¥', icon: <JapaneseYen /> },
    { code: 'GEL', name: 'Georgian Lari', symbolStr: '₾', icon: <GeorgianLari /> },
    { code: 'PHP', name: 'Philippine Peso', symbolStr: '₱', icon: <PhilippinePeso /> },
    { code: 'RUB', name: 'Russian Ruble', symbolStr: '₽', icon: <RussianRuble /> },
    { code: 'SAR', name: 'Saudi Riyal', symbolStr: '﷼', icon: <SaudiRiyal /> },
    { code: 'CHF', name: 'Swiss Franc', symbolStr: '₣', icon: <SwissFranc /> },
    { code: 'TRY', name: 'Turkish Lira', symbolStr: '₺', icon: <TurkishLira /> },
];

export const CurrencyCode = toRecord(CurrencyCodeList, 'code');

export type CurrencyCodeType = keyof typeof CurrencyCode;

type CurrencyProps = {
    code: CurrencyCodeType;
    variant: 'text' | 'icon';
    className?: string;
}

const Currency: React.FC<CurrencyProps> = ({ code, variant, className }) => {
    const currency = CurrencyCode[code];
    if (!currency) return null;
    if (variant === 'icon') {
        return <span className={className}>{currency.icon}</span>;
    } else {
        return <span>{currency.symbolStr}</span>;
    }
};

export default Currency;
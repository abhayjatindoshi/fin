import { DollarSign, Euro, GeorgianLari, IndianRupee, JapaneseYen, PhilippinePeso, PoundSterling, RussianRuble, SaudiRiyal, SwissFranc, TurkishLira } from "lucide-react";
import { toRecord } from "./ComponentUtils";

export type CurrencyDetails = {
    code: string;
    name: string;
    symbolStr: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    locale: Intl.Locale
}

const CurrencyCodeList: Array<CurrencyDetails> = [
    { code: 'INR', name: 'Indian Rupee', symbolStr: '₹', icon: IndianRupee, locale: new Intl.Locale('en-IN') },
    { code: 'USD', name: 'United States Dollar', symbolStr: '$', icon: DollarSign, locale: new Intl.Locale('en-US') },
    { code: 'EUR', name: 'Euro', symbolStr: '€', icon: Euro, locale: new Intl.Locale('de-DE') },
    { code: 'GBP', name: 'British Pound Sterling', symbolStr: '£', icon: PoundSterling, locale: new Intl.Locale('en-GB') },
    { code: 'JPY', name: 'Japanese Yen', symbolStr: '¥', icon: JapaneseYen, locale: new Intl.Locale('ja-JP') },
    { code: 'GEL', name: 'Georgian Lari', symbolStr: '₾', icon: GeorgianLari, locale: new Intl.Locale('ka-GE') },
    { code: 'PHP', name: 'Philippine Peso', symbolStr: '₱', icon: PhilippinePeso, locale: new Intl.Locale('en-PH') },
    { code: 'RUB', name: 'Russian Ruble', symbolStr: '₽', icon: RussianRuble, locale: new Intl.Locale('ru-RU') },
    { code: 'SAR', name: 'Saudi Riyal', symbolStr: '﷼', icon: SaudiRiyal, locale: new Intl.Locale('ar-SA') },
    { code: 'CHF', name: 'Swiss Franc', symbolStr: '₣', icon: SwissFranc, locale: new Intl.Locale('de-CH') },
    { code: 'TRY', name: 'Turkish Lira', symbolStr: '₺', icon: TurkishLira, locale: new Intl.Locale('tr-TR') },
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
        const Icon = currency.icon;
        return <Icon className={className} />;
    } else {
        return <span className={className}>{currency.symbolStr}</span>;
    }
};

export default Currency;
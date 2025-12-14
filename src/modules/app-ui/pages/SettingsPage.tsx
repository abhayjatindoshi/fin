import { Button } from "@/modules/base-ui/components/ui/button";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/modules/base-ui/components/ui/dropdown-menu";
import { Calendar, ChevronDown } from "lucide-react";
import moment from "moment";
import type React from "react";
import { CurrencyCode } from "../common/Currency";
import { useApp } from "../providers/AppProvider";

const SettingsPage: React.FC = () => {

    const { settings, updateSetting, isMobile } = useApp();

    const defaultCurrencyCode = settings?.['transaction.defaultCurrencyCode']
    const firstMonth = settings ? parseInt(settings['calendar.firstMonth']) : 0;
    const firstDay = settings ? parseInt(settings['calendar.firstDay']) : 0;

    const selectedCurrency = defaultCurrencyCode ? CurrencyCode[defaultCurrencyCode] ?? CurrencyCode['INR'] : CurrencyCode['INR'];

    return <div className={isMobile ? 'm-4' : "w-1/2"}>
        <table className="w-full">
            <tbody>
                <tr>
                    <td>Currency</td>
                    <td className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-56 m-2 flex flex-row float-end">
                                    <selectedCurrency.icon />
                                    {selectedCurrency.name}
                                    <span className="grow" />
                                    <ChevronDown />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {Object.values(CurrencyCode).map((currency) => (
                                    <DropdownMenuCheckboxItem key={currency.code} checked={selectedCurrency.code === currency.code} onSelect={async () => {
                                        await updateSetting('transaction.defaultCurrencyCode', currency.code);
                                    }}>
                                        {currency.name} ({currency.symbolStr})
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </td>
                </tr>
                <tr>
                    <td>First Month of Year</td>
                    <td className="text-right">
                        <DropdownMenu >
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-40 m-2 flex flex-row float-end">
                                    <Calendar />
                                    <span className="grow text-left">{moment().month(firstMonth).format('MMMM')}</span>
                                    <ChevronDown />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {Array.from({ length: 12 }).map((_, index) => (
                                    <DropdownMenuCheckboxItem key={index} checked={firstMonth === index} onSelect={async () => {
                                        await updateSetting('calendar.firstMonth', index.toString());
                                    }}>
                                        {moment().month(index).format('MMMM')}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </td>
                </tr>
                <tr>
                    <td>First Day of Week</td>
                    <td className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-40 m-2 flex flex-row float-end">
                                    <Calendar />
                                    <span className="grow text-left">{moment().day(firstDay).format('dddd')}</span>
                                    <ChevronDown />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {Array.from({ length: 7 }).map((_, index) => (
                                    <DropdownMenuCheckboxItem key={index} checked={firstDay === index} onSelect={async () => {
                                        await updateSetting('calendar.firstDay', index.toString());
                                    }}>
                                        {moment().day(index).format('dddd')}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
};

export default SettingsPage;
import { Utils } from "@/modules/common/Utils";
import moment, { type unitOfTime } from "moment";
import type { SettingKeys } from "../services/SettingService";

type TransactionDateFilterOption = {
    label: string;
    addUnit: number;
    addUnitDuration: unitOfTime.DurationConstructor;
}

export const TransactionDateFilterOptions: Record<string, TransactionDateFilterOption> = {
    'today': { label: 'Today', addUnit: 7, addUnitDuration: 'days' },
    'this_week': { label: 'This week', addUnit: 7, addUnitDuration: 'days' },
    'last_week': { label: 'Last week', addUnit: 7, addUnitDuration: 'days' },
    'this_month': { label: 'This month', addUnit: 1, addUnitDuration: 'months' },
    'last_month': { label: 'Last month', addUnit: 1, addUnitDuration: 'months' },
    'this_year': { label: 'This year', addUnit: 1, addUnitDuration: 'years' },
    'last_year': { label: 'Last year', addUnit: 1, addUnitDuration: 'years' },
} as const;

export class EntityUtils {
    public static hashTransaction(date: Date, amount: number, description: string): number {
        const dateStr = moment(date).format('DD-MM-YYYY');
        const descriptionStr = description.replaceAll(/[^\w]/g, '').toLowerCase();
        const amountStr = amount.toFixed(2);
        const str = `${dateStr}|${amountStr}|${descriptionStr}`;
        return Utils.generateHash(str);
    }

    public static parseTransactionDateFilter(
        key: keyof typeof TransactionDateFilterOptions,
        settings: Record<SettingKeys, string>,
    ): { label: string, startDate: Date, endDate?: Date, hint?: string } {

        const now = moment();
        const firstDayOfWeek = parseInt(settings["calendar.firstDay"] ?? '0');
        const firstMonthOfYear = parseInt(settings["calendar.firstMonth"] ?? '0');

        switch (key) {
            case 'today': {
                const startDate = now.clone().startOf('day');
                const endDate = now.clone().endOf('day');
                return { label: TransactionDateFilterOptions[key].label, startDate: startDate.toDate(), endDate: endDate.toDate() };
            }
            case 'this_week': {
                const startDate = now.clone().startOf('week').add(firstDayOfWeek, 'days');
                return { label: TransactionDateFilterOptions[key].label, startDate: startDate.toDate(), endDate: now.toDate() };
            }
            case 'last_week': {
                const startDate = now.clone().subtract(1, 'week').startOf('week').add(firstDayOfWeek, 'days');
                const endDate = startDate.clone().add(6, 'days').endOf('day');
                return { label: TransactionDateFilterOptions[key].label, startDate: startDate.toDate(), endDate: endDate.toDate() };
            }
            case 'this_month': {
                const startDate = now.clone().startOf('month');
                return { label: TransactionDateFilterOptions[key].label, startDate: startDate.toDate(), endDate: now.toDate(), hint: `${startDate.format('MMM YYYY')}` };
            }
            case 'last_month': {
                const startDate = now.clone().subtract(1, 'month').startOf('month');
                const endDate = startDate.clone().endOf('month');
                return { label: TransactionDateFilterOptions[key].label, startDate: startDate.toDate(), endDate: endDate.toDate(), hint: `${startDate.format('MMM YYYY')}` };
            }
            case 'this_year': {
                const startDate = now.month() < firstMonthOfYear ?
                    now.clone().subtract(1, 'year').month(firstMonthOfYear).startOf('month') :
                    now.clone().month(firstMonthOfYear).startOf('month');
                return { label: TransactionDateFilterOptions[key].label, startDate: startDate.toDate(), endDate: now.toDate(), hint: `${startDate.format('MMM YYYY')} to Today` };
            }
            case 'last_year': {
                const startDate = now.month() < firstMonthOfYear ?
                    now.clone().subtract(2, 'year').month(firstMonthOfYear).startOf('month') :
                    now.clone().subtract(1, 'year').month(firstMonthOfYear).startOf('month');
                const endDate = startDate.clone().add(11, 'months').endOf('month');
                return { label: TransactionDateFilterOptions[key].label, startDate: startDate.toDate(), endDate: endDate.toDate(), hint: `${startDate.format('MMM YYYY')} to ${endDate.format('MMM YYYY')}` };
            }
            default: throw new Error(`Unknown TransactionDateFilterOption key: ${key}`);
        }
    }

    public static parseTransactionYear(
        year: number,
        settings: Record<SettingKeys, string>,
    ): { label: string, startDate: Date, endDate?: Date, hint?: string } {
        const firstMonthOfYear = parseInt(settings["calendar.firstMonth"] ?? '0');

        const startDate = moment().year(year).month(firstMonthOfYear).startOf('month');
        const endDate = startDate.clone().add(11, 'months').endOf('month');
        return { label: `${year}`, startDate: startDate.toDate(), endDate: endDate.toDate(), hint: `${startDate.format('MMM YYYY')} to ${endDate.format('MMM YYYY')}` };
    }
}
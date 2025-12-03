import { Utils } from "@/modules/common/Utils";
import moment from "moment";
import type { SettingKeys } from "../services/SettingService";

export const TransactionDateFilterOptions = {
    'today': 'Today',
    'this_week': 'This week',
    'last_week': 'Last week',
    'this_month': 'This month',
    'last_month': 'Last month',
    'this_year': 'This year',
    'last_year': 'Last year',
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
        settings: Record<SettingKeys, string>
    ): { label: string, startDate: Date, endDate?: Date } {

        const now = moment();
        const firstDayOfWeek = parseInt(settings["calendar.firstDay"] ?? '0');
        const firstMonthOfYear = parseInt(settings["calendar.firstMonth"] ?? '0');

        switch (key) {
            case 'today': {
                const startDate = now.clone().startOf('day');
                const endDate = now.clone().endOf('day');
                return { label: TransactionDateFilterOptions[key], startDate: startDate.toDate(), endDate: endDate.toDate() };
            }
            case 'this_week': {
                const startDate = now.clone().startOf('week').add(firstDayOfWeek, 'days');
                return { label: TransactionDateFilterOptions[key], startDate: startDate.toDate() };
            }
            case 'last_week': {
                const startDate = now.clone().subtract(1, 'week').startOf('week').add(firstDayOfWeek, 'days');
                const endDate = startDate.clone().add(6, 'days').endOf('day');
                return { label: TransactionDateFilterOptions[key], startDate: startDate.toDate(), endDate: endDate.toDate() };
            }
            case 'this_month': {
                const startDate = now.clone().startOf('month');
                return { label: TransactionDateFilterOptions[key], startDate: startDate.toDate() };
            }
            case 'last_month': {
                const startDate = now.clone().subtract(1, 'month').startOf('month');
                const endDate = startDate.clone().endOf('month');
                return { label: TransactionDateFilterOptions[key], startDate: startDate.toDate(), endDate: endDate.toDate() };
            }
            case 'this_year': {
                const startDate = now.clone().month(firstMonthOfYear).startOf('month');
                return { label: TransactionDateFilterOptions[key], startDate: startDate.toDate() };
            }
            case 'last_year': {
                const startDate = now.clone().subtract(1, 'year').month(firstMonthOfYear).startOf('month');
                const endDate = startDate.clone().add(11, 'months').endOf('month');
                return { label: TransactionDateFilterOptions[key], startDate: startDate.toDate(), endDate: endDate.toDate() };
            }
        }
    }
}
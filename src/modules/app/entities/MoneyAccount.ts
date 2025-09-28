import type { Entity } from "@/modules/data-sync/interfaces/Entity";

export type AccountType =
    | 'SavingsAccount'
    | 'CreditCard'
    | 'Cash'

export interface MoneyAccount extends Entity {
    name: string;
    initialBalance: number;
    bankName: string;
    accountType: AccountType;
}

// TODO: define associations
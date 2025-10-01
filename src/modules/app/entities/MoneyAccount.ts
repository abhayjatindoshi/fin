import { EntitySchema } from "@/modules/data-sync/interfaces/Entity";
import * as z from "zod";

const AccountTypeSchema = z.enum(['SavingsAccount', 'CreditCard', 'Cash']);

export type AccountType = z.infer<typeof AccountTypeSchema>;

export const MoneyAccountSchema = EntitySchema.extend({
    name: z.string(),
    initialBalance: z.number(),
    bankName: z.string(),
    accountType: AccountTypeSchema,
})

export type MoneyAccount = z.infer<typeof MoneyAccountSchema>;
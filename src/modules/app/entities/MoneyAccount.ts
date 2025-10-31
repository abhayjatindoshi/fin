import { EntitySchema } from "@/modules/data-sync/entities/Entity";
import * as z from "zod";

export const MoneyAccountSchema = EntitySchema.extend({
    adapterName: z.string(),
    accountNumber: z.string(),
    initialBalance: z.number(),
    identifiers: z.array(z.string()),
    active: z.boolean(),
})

export type MoneyAccount = z.infer<typeof MoneyAccountSchema>;
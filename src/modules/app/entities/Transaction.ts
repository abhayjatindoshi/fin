import { EntitySchema } from "@/modules/data-sync/entities/Entity";
import { zodReference } from "@/modules/data-sync/interfaces/ZodOverrides";
import z from "zod";

export const TransactionSchema = EntitySchema.extend({
    accountId: zodReference("MoneyAccount"),
    tagId: zodReference("Tag").optional(),
    subtagId: zodReference("Subtag").optional(),
    transferAccountId: zodReference("MoneyAccount").optional(),
    merchantId: zodReference("Merchant").optional(),
    title: z.string(),
    narration: z.string(),
    transactionAt: z.date(),
    amount: z.number(),
    hash: z.number(),
});

export type Transaction = z.infer<typeof TransactionSchema>;
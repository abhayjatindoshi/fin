import { EntitySchema } from "@/modules/data-sync/interfaces/Entity";
import z from "zod";

export const TransactionSchema = EntitySchema.extend({
    accountId: z.string(),
    tagId: z.string(),
    subTagId: z.string().optional(),
    transferAccountId: z.string().optional(),
    merchantId: z.string().optional(),
    title: z.string(),
    narration: z.string(),
    transactionAt: z.date(),
    amount: z.number(),
    hash: z.number(),
});

export type Transaction = z.infer<typeof TransactionSchema>;
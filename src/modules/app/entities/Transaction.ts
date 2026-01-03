import { EntitySchema } from "@/modules/data-sync/entities/Entity";
import { zodReference } from "@/modules/data-sync/interfaces/ZodOverrides";
import z from "zod";

export const TransactionSourceTypeSchema = z.enum(['file', 'email']);
export const TransactionFileSourceSchema = z.object({
    type: z.literal('file'),
    fileName: z.string(),
});

export const SourceEmailSchema = z.object({
    id: z.string(),
    date: z.date(),
    from: z.string(),
    subject: z.string(),
})

export const TransactionEmailSourceSchema = z.object({
    type: z.literal('email'),
    authAccountId: z.string(),
    emailMessage: SourceEmailSchema,
});

export const TransactionSourceSchema = TransactionFileSourceSchema.or(TransactionEmailSourceSchema);

export const TransactionSchema = EntitySchema.extend({
    accountId: zodReference("MoneyAccount"),
    tagId: z.string().optional(),
    transferAccountId: zodReference("MoneyAccount").optional(),
    title: z.string(),
    narration: z.string(),
    transactionAt: z.date(),
    amount: z.number(),
    hash: z.number(),
    source: TransactionSourceSchema.optional(),
});

export type TransactionSourceType = z.infer<typeof TransactionSourceTypeSchema>;
export type TransactionFileSource = z.infer<typeof TransactionFileSourceSchema>;
export type TransactionEmailSource = z.infer<typeof TransactionEmailSourceSchema>;
export type TransactionSource = z.infer<typeof TransactionSourceSchema>;
export type Transaction = z.infer<typeof TransactionSchema>;
import { EntitySchema } from "@/modules/data-sync/entities/Entity";
import z from "zod";

export const BudgetLineSchema = EntitySchema.extend({
    tagId: z.string(),
    monthlyLimit: z.number().optional(),
    yearlyLimit: z.number().optional(),
    year: z.date(),
});

export type BudgetLine = z.infer<typeof BudgetLineSchema>;
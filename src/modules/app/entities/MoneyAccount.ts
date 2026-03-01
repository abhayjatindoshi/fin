import { EntitySchema } from "@/modules/data-sync/entities/Entity";
import { identifiers } from "@/modules/import/interfaces/ImportData";
import * as z from "zod";

const metadataArrayField = z.array(z.string()).optional();
type MetadataShape = { [K in typeof identifiers[number]]: typeof metadataArrayField };

export const MoneyAccountMetadataSchema = z.object(
    Object.fromEntries(identifiers.map(k => [k, metadataArrayField])) as MetadataShape
);

export const MoneyAccountSchema = EntitySchema.extend({
    bankId: z.string(),
    offeringId: z.string(),
    accountNumber: z.string(),
    initialBalance: z.number(),
    active: z.boolean(),
    metadata: MoneyAccountMetadataSchema.optional(),
})

export type MoneyAccountMetadata = z.infer<typeof MoneyAccountMetadataSchema>;
export type MoneyAccount = z.infer<typeof MoneyAccountSchema>;
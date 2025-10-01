import { EntitySchema } from "@/modules/data-sync/interfaces/Entity";
import z from "zod";

export const MerchantSchema = EntitySchema.extend({
    name: z.string(),
    icon: z.string(),
});

export type Merchant = z.infer<typeof MerchantSchema>;
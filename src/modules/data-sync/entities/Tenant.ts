import * as z from "zod";
import { EntitySchema } from "./Entity";

export const TenantSchema = EntitySchema.extend({
    name: z.string(),
    isDefault: z.boolean().optional(),
})

export type Tenant = z.infer<typeof TenantSchema>;
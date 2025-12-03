import * as z from "zod";
import { EntitySchema } from "./Entity";

export const TenantSchema = EntitySchema.extend({
    name: z.string(),
})

export type Tenant = z.infer<typeof TenantSchema>;
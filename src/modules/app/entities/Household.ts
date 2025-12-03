import { TenantSchema } from "@/modules/data-sync/entities/Tenant";
import * as z from "zod";

export const HouseholdSchema = TenantSchema.extend({
    spaceId: z.string(),
    folderId: z.string().optional(),
    folderName: z.string().optional(),
});

export type Household = z.infer<typeof HouseholdSchema>;
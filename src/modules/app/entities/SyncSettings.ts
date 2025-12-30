import { EntitySchema } from "@/modules/data-sync/entities/Entity";
import z from "zod";

export const SyncSettingsSchema = EntitySchema.extend({
    authAccountId: z.string(),
    syncInterval: z.number(), // in minutes
    lastSyncAt: z.date(),
})

export type SyncSettings = z.infer<typeof SyncSettingsSchema>;
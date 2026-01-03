import { EntitySchema } from "@/modules/data-sync/entities/Entity";
import z from "zod";

export const SyncPointSchema = z.object({
    id: z.string(),
    date: z.date(),
});

export const SyncErrorCode = z.enum([
    'password_required'
])
export const SyncError = z.object({
    code: SyncErrorCode,
    message: z.string().optional(),
})

export const SyncStatusSchema = z.object({
    startSyncPoint: SyncPointSchema.optional(),
    currentSyncPoint: SyncPointSchema.optional(),
    endSyncPoint: SyncPointSchema.optional(),
    syncedEmailCount: z.number().optional(),
    importedEmailCount: z.number().optional(),
    lastSyncAt: z.date().optional(),
    lastError: SyncError.optional(),
});

export const SyncSettingsSchema = EntitySchema.extend({
    authAccountId: z.string(),
    syncInterval: z.number(), // in minutes
    syncStatus: SyncStatusSchema.default({}),
});

export type SyncPoint = z.infer<typeof SyncPointSchema>;
export type SyncStatus = z.infer<typeof SyncStatusSchema>;
export type SyncSettings = z.infer<typeof SyncSettingsSchema>;
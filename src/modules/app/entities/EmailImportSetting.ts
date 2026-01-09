import { EntitySchema } from "@/modules/data-sync/entities/Entity";
import z from "zod";
import { PromptErrorTypes, type PromptErrorType } from "../import/errors/PromptError";
import type { EmailImportState, ImportPoint } from "../import/interfaces/ImportData";

export const ImportPointSchema = z.object({
    id: z.string(),
    date: z.date(),
}) satisfies z.ZodType<ImportPoint>;

export const ErrorTypeSchema = z.enum(PromptErrorTypes) satisfies z.ZodType<PromptErrorType>;

export const ImportErrorSchema = z.object({
    type: ErrorTypeSchema.optional(),
    message: z.string(),
}) satisfies z.ZodType<EmailImportState["lastError"]>;

export const EmailImportStateSchema = z.object({
    startPoint: ImportPointSchema.optional(),
    currentPoint: ImportPointSchema.optional(),
    endPoint: ImportPointSchema.optional(),
    readEmailCount: z.number().optional(),
    importedEmailCount: z.number().optional(),
    lastImportAt: z.date().optional(),
    lastError: ImportErrorSchema.optional(),
}) satisfies z.ZodType<EmailImportState>; ``

export const EmailImportSettingSchema = EntitySchema.extend({
    authAccountId: z.string(),
    importInterval: z.number(), // in minutes
    importState: EmailImportStateSchema.default({}),
});

export type EmailImportSetting = z.infer<typeof EmailImportSettingSchema>;
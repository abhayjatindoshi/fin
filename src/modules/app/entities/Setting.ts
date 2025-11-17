import { EntitySchema } from "@/modules/data-sync/entities/Entity";
import z from "zod";

export const SettingSchema = EntitySchema.extend({
    key: z.string(),
    value: z.string(),
})

export type Setting = z.infer<typeof SettingSchema>;
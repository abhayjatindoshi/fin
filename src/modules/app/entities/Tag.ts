import { EntitySchema } from "@/modules/data-sync/entities/Entity";
import z from "zod";

export const TagSchema = EntitySchema.extend({
    name: z.string(),
    description: z.string().optional(),
    icon: z.string(),
});

export type Tag = z.infer<typeof TagSchema>;
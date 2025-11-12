import { EntitySchema } from "@/modules/data-sync/entities/Entity";
import z from "zod";

export const TagSchema = EntitySchema.extend({
    name: z.string(),
    icon: z.string(),
    description: z.string().optional(),
    parent: z.string().optional(),
});

export type Tag = z.infer<typeof TagSchema>;
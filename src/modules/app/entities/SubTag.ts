import { EntitySchema } from "@/modules/data-sync/entities/Entity";
import z from "zod";

export const SubtagSchema = EntitySchema.extend({
    tagIds: z.string().array(),
    name: z.string(),
    icon: z.string(),
});

export type Subtag = z.infer<typeof SubtagSchema>;
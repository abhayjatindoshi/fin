import { EntitySchema } from "@/modules/data-sync/interfaces/Entity";
import z from "zod";

export const SubTagSchema = EntitySchema.extend({
    tagId: z.string(),
    name: z.string(),
    icon: z.string(),
});

export type SubTag = z.infer<typeof SubTagSchema>;
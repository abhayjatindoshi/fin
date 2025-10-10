import { EntitySchema } from "@/modules/data-sync/entities/Entity";
import { zodReference } from "@/modules/data-sync/interfaces/ZodOverrides";
import z from "zod";

export const SubTagSchema = EntitySchema.extend({
    tagId: zodReference("Tag"),
    name: z.string(),
    icon: z.string(),
});

export type SubTag = z.infer<typeof SubTagSchema>;
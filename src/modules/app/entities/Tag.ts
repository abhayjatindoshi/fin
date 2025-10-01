import { DataOrchestrator } from "@/modules/data-sync/DataOrchestrator";
import { EntitySchema } from "@/modules/data-sync/interfaces/Entity";
import z from "zod";

export const TagSchema = EntitySchema.extend({
    name: z.string(),
    icon: z.string(),
    referenceId: DataOrchestrator.zodReference("UserAccount"),
});

export type Tag = z.infer<typeof TagSchema>;
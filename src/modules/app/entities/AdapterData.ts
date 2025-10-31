import { EntitySchema } from "@/modules/data-sync/entities/Entity";
import * as z from "zod";

export const AdapterDataSchema = EntitySchema.extend({
    name: z.string(),
    passwords: z.array(z.string()),
});

export type AdapterData = z.infer<typeof AdapterDataSchema>;
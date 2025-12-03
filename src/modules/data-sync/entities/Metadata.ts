import * as z from "zod";
import { EntitySchema } from "./Entity";

const EntityMetadataSchema = z.object({
    count: z.number(),
    deletedCount: z.number()
});

const EntityKeyMetadataSchema = z.object({
    updatedAt: z.date(),
    hash: z.number(),
    entities: z.record(z.string(), EntityMetadataSchema)
});

export const MetadataSchema = EntitySchema.extend({
    entityKeys: z.record(z.string(), EntityKeyMetadataSchema),
})

export type Metadata = z.infer<typeof MetadataSchema>;
export type EntityKeyMetadata = z.infer<typeof EntityKeyMetadataSchema>;
export type EntityMetadata = z.infer<typeof EntityMetadataSchema>;
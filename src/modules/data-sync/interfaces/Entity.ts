import * as z from "zod";

export const EntitySchema = z.object({
    id: z.string().optional(),
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
    version: z.number().default(() => 0),
})

export type Entity = z.infer<typeof EntitySchema>;
import { EntitySchema } from "@/modules/data-sync/entities/Entity";
import z from "zod";

export const UserAccountSchema = EntitySchema.extend({
    name: z.string(),
    email: z.email(),
    picture: z.string().optional(),
});

export type UserAccount = z.infer<typeof UserAccountSchema>;
import { EntitySchema } from "@/modules/data-sync/interfaces/Entity";
import z from "zod";

export const UserAccountSchema = EntitySchema.extend({
    name: z.string(),
    email: z.email(),
});

export type UserAccount = z.infer<typeof UserAccountSchema>;
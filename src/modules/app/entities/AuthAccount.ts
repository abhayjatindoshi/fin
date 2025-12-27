import type { IAuthToken } from "@/modules/auth/interfaces/IAuthToken";
import type { IAuthUser } from "@/modules/auth/interfaces/IAuthUser";
import { EntitySchema } from "@/modules/data-sync/entities/Entity";
import * as z from "zod";

export const AuthTokenSchema = z.object({
    handlerId: z.string(),
    featureName: z.string(),
    accessToken: z.string(),
    refreshToken: z.string().optional(),
    expiry: z.date(),
}) satisfies z.ZodType<IAuthToken>;

export const AuthUserSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    picture: z.string().optional(),
}) satisfies z.ZodType<IAuthUser>;

export const AuthAccountSchema = EntitySchema.extend({
    token: AuthTokenSchema,
    user: AuthUserSchema,
})

export type AuthToken = z.infer<typeof AuthTokenSchema>;
export type AuthUser = z.infer<typeof AuthUserSchema>;
export type AuthAccount = z.infer<typeof AuthAccountSchema>;
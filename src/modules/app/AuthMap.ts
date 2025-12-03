import type { AuthConfig } from "../auth/AuthProvider";
import type { Token } from "../auth/types";
import type { Tenant } from "../data-sync/entities/Tenant";
import type { IPersistence } from "../data-sync/interfaces/IPersistence";
import { GoogleAuthConfig, GoogleDriveFileService } from "./store/cloud/google-drive/GoogleDriveFileService";

export type AuthType =
    | 'google';

export const AuthConfigMap: Record<AuthType, AuthConfig> = {
    google: GoogleAuthConfig,
}

export const AuthServiceMap: Record<AuthType, (token: () => Promise<Token | null>) => IPersistence<Tenant>> = {
    google: (token) => GoogleDriveFileService.load(token),
}
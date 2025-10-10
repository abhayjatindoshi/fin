import { GoogleAuthConfig, GoogleDriveFileService } from "../app/services/cloud/google-drive/GoogleDriveFileService";
import type { AuthConfig } from "../auth/AuthProvider";
import type { Token } from "../auth/types";
import type { Tenant } from "../data-sync/entities/Tenant";
import type { IPersistence } from "../data-sync/interfaces/IPersistence";

export type AuthType =
    | 'google';

export const AuthConfigMap: Record<AuthType, AuthConfig> = {
    google: GoogleAuthConfig,
}

export const AuthServiceMap: Record<AuthType, (token: () => Promise<Token | null>) => IPersistence<Tenant>> = {
    google: (token) => GoogleDriveFileService.load(token),
}
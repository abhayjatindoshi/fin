import { GoogleAuthConfig, GoogleDriveFileService } from "../app/services/cloud/google-drive/GoogleDriveFileService";
import type { ICloudService } from "../app/services/cloud/ICloudService";
import type { AuthConfig } from "../auth/AuthProvider";
import type { Token } from "../auth/types";
import { GoogleDriveTenantSelection } from "./components/tenant-selection/GoogleDriveTenantSelection";

export type AuthType =
    | 'google';

export const AuthConfigMap: Record<AuthType, AuthConfig> = {
    google: GoogleAuthConfig,
}

export const AuthServiceMap: Record<AuthType, (token: () => Promise<Token | null>) => ICloudService> = {
    google: (token) => GoogleDriveFileService.load(token),
}

export const AuthHouseholdPageMap: Record<AuthType, React.FC> = {
    google: GoogleDriveTenantSelection,
}
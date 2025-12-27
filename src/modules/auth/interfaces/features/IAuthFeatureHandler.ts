import type { IAuthHandler } from "../IAuthHandler";

export const AuthFeatureNames = ['storage', 'mail'] as const;
export type IAuthFeatureName = typeof AuthFeatureNames[number];

export interface IAuthFeatureHandler extends IAuthHandler {
    featureName: IAuthFeatureName;
}
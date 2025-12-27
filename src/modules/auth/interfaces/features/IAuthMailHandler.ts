import type { IAuthFeatureHandler } from "./IAuthFeatureHandler";

export interface IAuthMailHandler extends IAuthFeatureHandler {
    featureName: 'mail';
}
export interface IAuthToken {
    handlerId: string;
    featureName: string;
    accessToken: string;
    refreshToken?: string;
    expiry: Date;
}
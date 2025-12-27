import type { IAuthToken } from "./IAuthToken";
import type { IAuthUser } from "./IAuthUser";

export interface IAuthHandler {
    id: string;
    getLoginUrl(state: string): Promise<string>;
    handleCode(code: string): Promise<IAuthToken>;
    getValidToken(token: IAuthToken): Promise<IAuthToken>;
    getUser(token: IAuthToken): Promise<IAuthUser>;
}
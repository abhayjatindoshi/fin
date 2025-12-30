import type { IAuthMailHandler } from "../../interfaces/features/IAuthMailHandler";
import type { IAuthToken } from "../../interfaces/IAuthToken";
import { GoogleHandler } from "./GoogleHandler";

export class GoogleMailHandler extends GoogleHandler implements IAuthMailHandler {
    featureName: 'mail' = 'mail';
    scopes = [
        'openid', 'email', 'profile',
        'https://www.googleapis.com/auth/gmail.readonly',
    ];
    private API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me/messages';

    async getMailListing(token: IAuthToken,)
}
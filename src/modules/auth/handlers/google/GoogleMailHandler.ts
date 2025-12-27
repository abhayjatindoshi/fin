import type { IAuthMailHandler } from "../../interfaces/features/IAuthMailHandler";
import { GoogleHandler } from "./GoogleHandler";

export class GoogleMailHandler extends GoogleHandler implements IAuthMailHandler {
    featureName: 'mail' = 'mail';
    scopes = [
        'openid', 'email', 'profile',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
    ];
}
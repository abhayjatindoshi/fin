import type { IAuth } from "../../interfaces/IAuth";
import { GoogleDriveHandler } from "./GoogleDriveHandler";
import { GoogleLoginButton } from "./GoogleLoginButton";
import { GoogleMailHandler } from "./GoogleMailHandler";
import GmailIcon from './google-gmail.svg?react';
import GoogleIcon from './google-icon.svg?react';

export class Google implements IAuth {
    id = 'google';
    display = {
        name: 'Google',
        icon: GoogleIcon,
        button: GoogleLoginButton,
    }
    features = [
        {
            id: 'drive',
            display: { name: 'Google Drive' },
            handler: new GoogleDriveHandler(),
        }, {
            id: 'gmail',
            display: { name: 'Gmail', icon: GmailIcon },
            handler: new GoogleMailHandler(),
        }
    ]
}
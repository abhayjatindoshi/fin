import type { IAuth } from "../../interfaces/IAuth";
import MicrosoftIcon from './microsoft-icon.svg?react';
import { MicrosoftLoginButton } from "./MicrosoftLoginButton";
import { MicrosoftMailHandler } from "./MicrosoftMailHandler";

export class Microsoft implements IAuth {
    id = 'microsoft'
    display = {
        name: 'Microsoft',
        icon: MicrosoftIcon,
        button: MicrosoftLoginButton,
    }
    features = [
        {
            id: 'outlook',
            display: { name: 'Outlook' },
            handler: new MicrosoftMailHandler(),
        }
    ]
}
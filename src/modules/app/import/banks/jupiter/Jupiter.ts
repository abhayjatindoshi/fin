import type { IBank } from "../../interfaces/IBank";
import { JupiterEmailAdapter } from "./JupiterEmailAdapter";
import { JupiterPdfAdapter } from "./JupiterPdfAdapter";

export class Jupiter implements IBank {
    id = 'jupiter';
    display = {
        name: 'Jupiter',
        icon: 'jupiter',
    }
    offerings = [
        {
            id: 'upi-account',
            display: {
                name: 'UPI Account',
            },
            adapters: [
                new JupiterPdfAdapter(),
                new JupiterEmailAdapter(),
            ]
        }
    ]
}
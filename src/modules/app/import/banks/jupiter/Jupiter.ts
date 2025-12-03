import type { IBank } from "../../interfaces/IBank";
import type { IBankDisplay } from "../../interfaces/IBankDisplay";
import type { IBankOffering } from "../../interfaces/IBankOffering";
import { JupiterPdfAdapter } from "./JupiterPdfAdapter";

export class Jupiter implements IBank {
    id = 'jupiter';
    display: IBankDisplay = {
        name: 'Jupiter',
        icon: 'jupiter',
    }
    offerings: IBankOffering[] = [
        {
            id: 'upi-account',
            display: {
                name: 'UPI Account',
            },
            adapters: [
                new JupiterPdfAdapter()
            ]
        }
    ]
}
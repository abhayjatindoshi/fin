import type { IBank } from "../../interfaces/IBank";
import type { IBankDisplay } from "../../interfaces/IBankDisplay";
import type { IBankOffering } from "../../interfaces/IBankOffering";
import { FederalBankPdfAdapter } from "./FederalBankPdfAdapter";

export class FederalBank implements IBank {
    id = 'federal';
    display: IBankDisplay = {
        name: 'Federal Bank',
        icon: 'federal',
    }
    offerings: IBankOffering[] = [
        {
            id: 'credit-card',
            display: {
                name: 'Credit Card',
            },
            adapters: [
                new FederalBankPdfAdapter()
            ]
        }
    ]
}
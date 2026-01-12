import type { IBank } from "../../interfaces/IBank";
import { FederalBankPdfAdapter } from "./FederalBankPdfAdapter";

export class FederalBank implements IBank {
    id = 'federal';
    display = {
        name: 'Federal Bank',
        icon: 'federal',
    }
    offerings = [
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
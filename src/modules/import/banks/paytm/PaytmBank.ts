import type { IBank } from "../../interfaces/IBank";
import { PaytmBankEmailAdapter } from "./PaytmBankEmailAdapter";
import { PaytmBankPdfAdapter } from "./PaytmBankPdfAdapter";

export class PaytmBank implements IBank {
    id = 'paytm';
    display = {
        name: 'Paytm Payments Bank',
        icon: 'paytm',
    }
    offerings = [
        {
            id: 'savings-account',
            display: {
                name: 'Savings Account',
            },
            adapters: [
                new PaytmBankPdfAdapter(),
                new PaytmBankEmailAdapter(),
            ]
        }
    ]
}
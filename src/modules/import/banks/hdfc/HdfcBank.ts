import type { IBank } from "../../interfaces/IBank";
import { HdfcBankEmailAdapter } from "./HdfcBankEmailAdapter";
import { HdfcBankPdfAdapter } from "./HdfcBankPdfAdapter";
import { HdfcCreditCardPdfAdapter } from "./HdfcCreditCardPdfAdapter";

export class HdfcBank implements IBank {
    id = 'hdfc';
    display = {
        name: 'Hdfc Bank',
        icon: 'hdfc',
    }
    offerings = [
        {
            id: 'savings-account',
            display: {
                name: 'Savings Account',
            },
            adapters: [
                new HdfcBankPdfAdapter(),
                new HdfcBankEmailAdapter(),
            ]
        },
        {
            id: 'credit-card',
            display: {
                name: 'Credit Card',
            },
            adapters: [
                new HdfcCreditCardPdfAdapter(),
            ]
        }
    ]
}
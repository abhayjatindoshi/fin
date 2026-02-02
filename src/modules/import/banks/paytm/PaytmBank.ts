import type { IBank } from "../../interfaces/IBank";
import { PaytmBankEmailAdapter } from "./PaytmBankEmailAdapter";
import { PaytmBankSavingsAccountPdfAdapter } from "./PaytmBankSavingsAccountPdfAdapter";
import { PaytmBankWalletPdfAdapter } from "./PaytmBankWalletPdfAdapter";

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
                new PaytmBankEmailAdapter('savings-account'),
                new PaytmBankSavingsAccountPdfAdapter(),
            ]
        },
        {
            id: 'wallet',
            display: {
                name: 'Paytm Wallet',
            },
            adapters: [
                new PaytmBankEmailAdapter('wallet'),
                new PaytmBankWalletPdfAdapter(),
            ],
        }
    ]
}
import type { IBank } from "../../interfaces/IBank";
import { HdfcBankPdfAdapter } from "./HdfcBankPdfAdapter";

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
                new HdfcBankPdfAdapter()
            ]
        }
    ]
}
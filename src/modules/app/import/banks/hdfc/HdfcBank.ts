import type { IBank } from "../../interfaces/IBank";
import type { IBankDisplay } from "../../interfaces/IBankDisplay";
import type { IBankOffering } from "../../interfaces/IBankOffering";
import { HdfcBankPdfAdapter } from "./HdfcBankPdfAdapter";

export class HdfcBank implements IBank {
    id = 'hdfc';
    display: IBankDisplay = {
        name: 'Hdfc Bank',
        icon: 'hdfc',
    }
    offerings: IBankOffering[] = [
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
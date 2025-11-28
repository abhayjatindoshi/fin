import { FederalBankCreditCard } from "./adapters/federal/FederalBankCreditCard";
import { HdfcBankAccount } from "./adapters/hdfc/HdfcBankAccount";
import { JupiterBankAccount } from "./adapters/jupiter/JupiterBankAccount";

export class ImportMatrix {
    static {
        [
            new HdfcBankAccount(),
            new FederalBankCreditCard(),
            new JupiterBankAccount(),
        ]
    }
}
import { FederalBank } from "./banks/federal/FederalBank";
import { HdfcBank } from "./banks/hdfc/HdfcBank";
import { Jupiter } from "./banks/jupiter/Jupiter";
import { PaytmBank } from "./banks/paytm/PaytmBank";
import type { IBank } from "./interfaces/IBank";
import type { IBankOffering } from "./interfaces/IBankOffering";
import type { IImportAdapter } from "./interfaces/IImportAdapter";

export class ImportMatrix {

    public static Banks: Record<string, IBank> = {};
    public static Adapters: Record<string, IImportAdapter> = {};
    public static AdapterBankData: Record<string, [IBank, IBankOffering]> = {};

    static {
        const banks: IBank[] = [
            new FederalBank(),
            new HdfcBank(),
            new Jupiter(),
            new PaytmBank(),
        ]

        banks.forEach(bank => {
            ImportMatrix.Banks[bank.id] = bank;
            bank.offerings.forEach(offering => {
                offering.adapters.forEach(adapter => {
                    let adapterId = `${bank.id}-${offering.id}-${adapter.type}`;
                    if ('fileType' in adapter) {
                        adapterId += `-${adapter.fileType}`;
                    }
                    adapter.id = adapterId;
                    ImportMatrix.Adapters[adapterId] = adapter;
                    ImportMatrix.AdapterBankData[adapterId] = [bank, offering];
                });
            });
        });
    }
}
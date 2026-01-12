import type { IBankDisplay } from "./IBankDisplay";
import type { IImportAdapter } from "./IImportAdapter";

export interface IBankOffering {
    id: string;
    display: Partial<IBankDisplay>;
    adapters: IImportAdapter[];
}
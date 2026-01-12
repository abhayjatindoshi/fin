import type { IBankDisplay } from "./IBankDisplay";
import type { IBankOffering } from "./IBankOffering";

export interface IBank {
    id: string;
    display: IBankDisplay;
    offerings: IBankOffering[];
}
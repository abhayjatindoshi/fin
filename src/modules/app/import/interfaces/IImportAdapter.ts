export interface IImportAdapter {
    name: string;
    type: ImportAdapterType;
    display: {
        bankName: string;
        icon: string;
        type: string;
    }
}

export type ImportAdapterType = 'savings-account' | 'credit-card';
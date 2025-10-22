export interface IImportAdapter {
    name: string;
    type: ImportAdapterType;
    displayName: string;
    displayIcon: string;
}

export type ImportAdapterType = 'savings-account' | 'credit-card';
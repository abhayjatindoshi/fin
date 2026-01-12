export type ImportAdapterType = 'file' | 'email';

export interface IImportAdapter {
    id: string;
    type: ImportAdapterType;
}
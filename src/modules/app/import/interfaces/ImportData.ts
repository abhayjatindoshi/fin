export type ImportData = {
    identifiers: string[];
    transactions: ImportedTransaction[];
}

export type ImportedTransaction = {
    date: Date;
    description: string;
    amount: number;
    isNew?: boolean;
    hash?: number;
}

export type Email = {
    from: string;
    // TODO: add other email fields as needed
}
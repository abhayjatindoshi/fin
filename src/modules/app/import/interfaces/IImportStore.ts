export interface IImportStore {
    getCurrentProcesses(): Promise<string[]>;
}
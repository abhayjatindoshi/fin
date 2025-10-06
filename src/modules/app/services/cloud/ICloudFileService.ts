import type { CloudFile, CloudSpace } from "./types";

export interface ICloudFileService {
    getSpaces(): Promise<Array<CloudSpace>>;
    getListing(space: CloudSpace, parentFolderId?: string, search?: string): Promise<Array<CloudFile>>;
    createFolder(space: CloudSpace, name: string, parentFolderId?: string): Promise<CloudFile>;
}
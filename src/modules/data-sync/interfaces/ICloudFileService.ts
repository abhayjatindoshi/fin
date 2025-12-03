export type CloudFile = {
    id: string;
    name: string;
    type?: string;
    isFolder: boolean;
    modifiedTime?: Date;
}

export type CloudSpace = {
    id: string;
    displayName: string;
}

export interface ICloudFileService {
    getSpaces(): Promise<Array<CloudSpace>>;
    getListing(space: CloudSpace, parentFolderId?: string, search?: string): Promise<Array<CloudFile>>;
    createFolder(space: CloudSpace, name: string, parentFolderId?: string): Promise<CloudFile>;
}
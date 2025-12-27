import type { IAuthToken } from "../IAuthToken";
import type { IAuthFeatureHandler } from "./IAuthFeatureHandler";

export type CloudSpace = {
    id: string;
    displayName: string;
}

export type CloudFile = {
    id: string;
    name: string;
    type?: string;
    isFolder: boolean;
    modifiedTime?: Date;
}

export interface IAuthStorageHandler extends IAuthFeatureHandler {
    featureName: 'storage';

    getSpaces(token: IAuthToken): Promise<Array<CloudSpace>>;
    getFileListing(token: IAuthToken, space: CloudSpace, parentFolderId?: string, search?: string, trashed?: boolean): Promise<CloudFile[]>;

    createFolder(token: IAuthToken, space: CloudSpace, name: string, parentFolderId?: string): Promise<CloudFile>;

    readFile(token: IAuthToken, space: CloudSpace, fileId: string): Promise<string>;
    createFile(token: IAuthToken, space: CloudSpace, fileId: string, content: string, parentFolderId?: string): Promise<CloudFile>;
    updateFile(token: IAuthToken, space: CloudSpace, fileId: string, fileName: string, content: string): Promise<CloudFile>;
    deleteFile(token: IAuthToken, space: CloudSpace, fileId: string): Promise<void>;
}
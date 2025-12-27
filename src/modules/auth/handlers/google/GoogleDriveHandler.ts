import { Utils } from "@/modules/common/Utils";
import type { CloudFile, CloudSpace, IAuthStorageHandler } from "../../interfaces/features/IAuthStorageHandler";
import type { IAuthToken } from "../../interfaces/IAuthToken";
import { GoogleHandler } from "./GoogleHandler";

export type FileResponse = {
    id: string;
    name: string;
    mimeType: string;
    modifiedTime: Date;
};

export type Metadata = {
    name: string;
    mimeType: string;
    parents?: string[];
};

export type GoogleDriveSpaceId = 'drive' | 'appDataFolder' | 'sharedWithMe';

export type GoogleDriveSpace = CloudSpace & { id: GoogleDriveSpaceId };

export const GoogleDriveSpaceMap: Record<GoogleDriveSpaceId, GoogleDriveSpace> = {
    drive: { id: 'drive', displayName: 'My Drive' },
    appDataFolder: { id: 'appDataFolder', displayName: 'App Folder' },
    sharedWithMe: { id: 'sharedWithMe', displayName: 'Shared With Me' },
};

export class GoogleDriveHandler extends GoogleHandler implements IAuthStorageHandler {
    featureName: 'storage' = 'storage';
    scopes = [
        'openid', 'email', 'profile',
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/drive.appdata',
    ];
    private API_BASE = 'https://www.googleapis.com/drive/v3/files';

    async getSpaces(_: IAuthToken): Promise<Array<GoogleDriveSpace>> {
        return Promise.resolve(Object.values(GoogleDriveSpaceMap));
    }

    async getFileListing(
        token: IAuthToken, space: GoogleDriveSpace,
        parentFolderId?: string, search?: string,
        trashed: boolean = false
    ): Promise<CloudFile[]> {

        token = await this.getValidToken(token);

        const params = new URLSearchParams();
        params.set('fields', 'files(id,name,mimeType,modifiedTime)');
        const queryParts = [];
        switch (space.id) {
            case 'drive': {
                queryParts.push(`'${parentFolderId ? parentFolderId : 'root'}' in parents`);
                break;
            }
            case 'appDataFolder': {
                params.set('spaces', 'appDataFolder');
                break;
            }
            case 'sharedWithMe': {
                if (parentFolderId) queryParts.push(`'${parentFolderId}' in parents`);
                else queryParts.push('sharedWithMe=true');
                break;
            }
        }
        if (search) queryParts.push(`name contains '${search.replace(/'/g, "\\'")}'`);
        queryParts.push(`trashed=${trashed}`);
        params.set('q', queryParts.join(' and '));

        const response = await fetch(`${this.API_BASE}?${params.toString()}`, {
            headers: {
                Authorization: `Bearer ${token.accessToken}`
            }
        });
        if (!response.ok) {
            throw new Error(`Error fetching Google Drive listing: ${response.status} ${response.statusText}`);
        }
        const data = await response.text();
        const jsonData = Utils.parseJson<{ files: FileResponse[] }>(data);
        return jsonData.files.map(this.parseFileResponse);
    }

    async createFolder(
        token: IAuthToken, space: GoogleDriveSpace,
        name: string, parentFolderId?: string
    ): Promise<CloudFile> {
        if (space.id === 'appDataFolder') throw new Error('Cannot create folders in App Data Folder');
        if (space.id === 'sharedWithMe' && !parentFolderId) throw new Error('Must specify parent folder when creating folder in Shared With Me');
        if (space.id === 'drive' && !parentFolderId) parentFolderId = 'root';

        token = await this.getValidToken(token);

        const response = await fetch(`${this.API_BASE}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [parentFolderId]
            })
        });
        if (!response.ok) {
            throw new Error(`Error creating Google Drive folder: ${response.status} ${response.statusText}`);
        }
        const data = await response.text();
        const jsonData = Utils.parseJson<FileResponse>(data);
        return this.parseFileResponse(jsonData);
    }

    async readFile(token: IAuthToken, space: GoogleDriveSpace, fileId: string): Promise<string> {
        token = await this.getValidToken(token);
        const params = new URLSearchParams();
        params.set('alt', 'media');
        if (space.id === 'appDataFolder') params.set('spaces', 'appDataFolder');
        const response = await fetch(`${this.API_BASE}/${fileId}?${params.toString()}`, {
            headers: {
                Authorization: `Bearer ${token.accessToken}`,
            }
        });
        if (!response.ok) {
            throw new Error(`Error reading Google Drive file: ${response.status} ${response.statusText}`);
        }
        return await response.text();
    }

    async createFile(token: IAuthToken, space: GoogleDriveSpace, name: string, content: string, parentFolderId?: string): Promise<CloudFile> {
        if (space.id === 'appDataFolder' && parentFolderId) throw new Error('Cannot specify parent folder when creating file in App Data Folder');
        if (space.id === 'sharedWithMe' && !parentFolderId) throw new Error('Must specify parent folder when creating file in Shared With Me');
        if (space.id === 'drive' && !parentFolderId) parentFolderId = 'root';

        token = await this.getValidToken(token);

        const file = new Blob([content], { type: 'text/plain' });
        const metadata: Metadata = {
            name,
            mimeType: 'text/plain',
        };
        if (parentFolderId) metadata['parents'] = [parentFolderId];
        if (space.id === 'appDataFolder') metadata['parents'] = ['appDataFolder'];
        const form = new FormData();
        form.append('metadata', new Blob([Utils.stringifyJson(metadata)], { type: 'application/json' }));
        form.append('file', file);

        const params = new URLSearchParams();
        params.set('uploadType', 'multipart');

        const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files?${params.toString()}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token.accessToken}`, },
            body: form,
        });
        if (!response.ok) {
            throw new Error(`Failed to upload file: ${response.statusText}`);
        }

        const responseData = await response.json() as FileResponse;
        return this.parseFileResponse(responseData);
    }

    async updateFile(token: IAuthToken, _: GoogleDriveSpace, fileId: string, fileName: string, content: string): Promise<CloudFile> {
        token = await this.getValidToken(token);

        const metadata: Metadata = {
            name: fileName,
            mimeType: 'text/plain',
        };
        const fileBlob = new Blob([content], { type: 'text/plain' });
        const formData = new FormData();
        formData.append('metadata', new Blob([Utils.stringifyJson(metadata)], { type: 'application/json' }));
        formData.append('file', fileBlob);

        const params = new URLSearchParams();
        params.set('uploadType', 'multipart');

        const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?${params.toString()}`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${token.accessToken}`,
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Error updating Google Drive file: ${response.status} ${response.statusText}`);
        }

        const responseData = await response.json() as FileResponse;
        return this.parseFileResponse(responseData);
    }

    async deleteFile(token: IAuthToken, space: GoogleDriveSpace, fileId: string): Promise<void> {
        token = await this.getValidToken(token);
        const params = new URLSearchParams();
        if (space.id === 'appDataFolder') params.set('spaces', 'appDataFolder');
        const response = await fetch(`${this.API_BASE}/${fileId}?${params.toString()}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token.accessToken}`,
            }
        });
        if (!response.ok) {
            throw new Error(`Error deleting Google Drive file: ${response.status} ${response.statusText}`);
        }
        return;
    }

    private parseFileResponse(file: FileResponse): CloudFile {
        return {
            id: file.id,
            name: file.name,
            type: file.mimeType,
            isFolder: file.mimeType === 'application/vnd.google-apps.folder',
            modifiedTime: file.modifiedTime ? new Date(file.modifiedTime) : undefined,
        };
    }
}
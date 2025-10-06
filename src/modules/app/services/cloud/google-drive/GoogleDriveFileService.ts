import type { AuthConfig } from "@/modules/auth/AuthProvider";
import type { Token } from "@/modules/auth/types";
import { Utils } from "@/modules/common/Utils";
import type { IPersistence } from "@/modules/data-sync/interfaces/IPersistence";
import type { EntityKeyData } from "@/modules/data-sync/interfaces/types";
import type { ICloudFileService } from "../ICloudFileService";
import type { CloudFile, CloudSpace, Config } from "../types";

export type GoogleDriveSpaceId = 'drive' | 'appDataFolder' | 'sharedWithMe';

export type GoogleDriveSpace = CloudSpace & { id: GoogleDriveSpaceId };

type FileResponse = {
    id: string;
    name: string;
    mimeType: string;
    modifiedTime: Date;
};

type Metadata = {
    name: string;
    mimeType: string;
    parents?: string[];
};

export const GoogleAuthConfig: AuthConfig = {
    type: 'google',
    clientId: '8125620125-tkfb5448rfhk389h550ghpljk73ompe6.apps.googleusercontent.com',
    scopes: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/drive.appdata',
    ]
};

export class GoogleDriveFileService implements ICloudFileService, IPersistence {
    private static instance: GoogleDriveFileService | null = null;

    public static load(getToken: () => Promise<Token | null>): GoogleDriveFileService {
        if (!GoogleDriveFileService.instance) {
            GoogleDriveFileService.instance = new GoogleDriveFileService(getToken);
        }
        return GoogleDriveFileService.instance;
    }

    public static getInstance(): GoogleDriveFileService {
        if (!GoogleDriveFileService.instance) {
            throw new Error('GoogleDriveFileService not initialized');
        }
        return GoogleDriveFileService.instance;
    }

    private static API_BASE = 'https://www.googleapis.com/drive/v3/files';

    // space vs folderId vs filename vs fileId
    private fileMap: { [key in GoogleDriveSpaceId]?: Record<string, Record<string, string>> } = {};
    private getToken: () => Promise<Token | null>;
    private config: Config | null = null;

    private constructor(getToken: () => Promise<Token | null>) {
        this.getToken = getToken;
    }

    async getConfig(): Promise<Config | null> {
        if (this.config) return this.config;
        await this.ensureFileMapEntry('appDataFolder', 'root', 'config.json');
        const fileId = this.fileMap['appDataFolder']?.['root']?.['config.json'];
        if (!fileId) {
            this.config = { households: [] };
            return this.config;
        }
        const content = await this.readFile({ id: 'appDataFolder', displayName: 'App Folder' }, fileId);
        this.config = Utils.parseJson<Config>(content);
        return this.config;
    }

    async saveConfig(config: Config): Promise<void> {
        const content = Utils.stringifyJson(config);
        await this.ensureFileMapEntry('appDataFolder', 'root', 'config.json');
        const fileId = this.fileMap['appDataFolder']?.['root']?.['config.json'];
        if (fileId) {
            await this.updateFile({ id: 'appDataFolder', displayName: 'App Folder' }, fileId, 'config.json', content);
        } else {
            await this.createFile({ id: 'appDataFolder', displayName: 'App Folder' }, 'config.json', content);
        }
    }

    getSpaces = (): Promise<GoogleDriveSpace[]> => Promise.resolve([
        { id: 'drive', displayName: 'My Drive' },
        { id: 'appDataFolder', displayName: 'App Folder' },
        { id: 'sharedWithMe', displayName: 'Shared With Me' },
    ]);

    async getListing(space: GoogleDriveSpace, folderId?: string, search?: string): Promise<CloudFile[]> {
        const token = await this.getToken();
        if (!token) throw new Error('No auth token available');

        const params = new URLSearchParams();
        params.set('fields', 'files(id,name,mimeType,modifiedTime)');
        const queryParts = [];
        switch (space.id) {
            case 'drive': {
                queryParts.push(`'${folderId ? folderId : 'root'}' in parents`);
                break;
            }
            case 'appDataFolder': {
                params.set('spaces', 'appDataFolder');
                break;
            }
            case 'sharedWithMe': {
                if (folderId) queryParts.push(`'${folderId}' in parents`);
                else queryParts.push('sharedWithMe=true');
                break;
            }
        }
        if (search) queryParts.push(`name contains '${search.replace(/'/g, "\\'")}'`);
        queryParts.push("trashed=false");
        params.set('q', queryParts.join(' and '));

        const response = await fetch(`${GoogleDriveFileService.API_BASE}?${params.toString()}`, {
            headers: {
                Authorization: `Bearer ${token.token}`
            }
        });
        if (!response.ok) {
            throw new Error(`Error fetching Google Drive listing: ${response.status} ${response.statusText}`);
        }
        const data = await response.text();
        const jsonData = Utils.parseJson<{ files: FileResponse[] }>(data);
        jsonData.files.forEach(f => this.addToFileMap(space.id, folderId || 'root', f));
        return jsonData.files.map((file) => ({
            id: file.id,
            name: file.name,
            type: file.mimeType,
            isFolder: file.mimeType === 'application/vnd.google-apps.folder',
            modifiedTime: file.modifiedTime ? new Date(file.modifiedTime) : undefined,
        }));
    }

    async createFolder(space: GoogleDriveSpace, name: string, parentFolderId?: string): Promise<CloudFile> {
        if (space.id === 'appDataFolder') throw new Error('Cannot create folders in App Data Folder');
        if (space.id === 'sharedWithMe' && !parentFolderId) throw new Error('Must specify parent folder when creating folder in Shared With Me');
        if (space.id === 'drive' && !parentFolderId) parentFolderId = 'root';

        const token = await this.getToken();
        if (!token) throw new Error('No auth token available');

        const response = await fetch(`${GoogleDriveFileService.API_BASE}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token.token}`,
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
        return {
            id: jsonData.id,
            name: jsonData.name,
            type: jsonData.mimeType,
            isFolder: true,
            modifiedTime: jsonData.modifiedTime ? new Date(jsonData.modifiedTime) : undefined,
        };
    }

    async loadData(key: string): Promise<EntityKeyData | null> {
        const householdId = key.split('.')[0];
        await this.ensureConfig();
        const household = this.config?.households.find(h => h.id === householdId);
        if (!household) return null;
        await this.ensureFileMapEntry(
            household.location.space.id as GoogleDriveSpaceId,
            household.location.folder?.id || 'root', key);
        const fileId = this.fileMap[household.location.space.id as GoogleDriveSpaceId]?.[household.location.folder?.id || 'root']?.[key];
        if (!fileId) return null;
        const content = await this.readFile(household.location.space as GoogleDriveSpace, fileId);
        return Utils.parseJson<EntityKeyData>(content);
    }

    async storeData(key: string, data: EntityKeyData): Promise<void> {
        const householdId = key.split('.')[0];
        await this.ensureConfig();
        const household = this.config?.households.find(h => h.id === householdId);
        if (!household) throw new Error(`Household with ID ${householdId} not found in config`);
        const content = Utils.stringifyJson(data);
        await this.ensureFileMapEntry(
            household.location.space.id as GoogleDriveSpaceId,
            household.location.folder?.id || 'root', key);
        const fileId = this.fileMap[household.location.space.id as GoogleDriveSpaceId]?.[household.location.folder?.id || 'root']?.[key];
        if (fileId) {
            await this.updateFile(household.location.space as GoogleDriveSpace, fileId, key, content);
        } else {
            await this.createFile(household.location.space as GoogleDriveSpace, key, content, household.location.folder?.id);
        }
    }

    async clearData(key: string): Promise<void> {
        const householdId = key.split('.')[0];
        await this.ensureConfig();
        const household = this.config?.households.find(h => h.id === householdId);
        if (!household) throw new Error(`Household with ID ${householdId} not found in config`);
        await this.ensureFileMapEntry(
            household.location.space.id as GoogleDriveSpaceId,
            household.location.folder?.id || 'root', key);
        const fileId = this.fileMap[household.location.space.id as GoogleDriveSpaceId]?.[household.location.folder?.id || 'root']?.[key];
        if (fileId) {
            await this.deleteFile(household.location.space as GoogleDriveSpace, fileId);
        }
    }

    private async readFile(space: GoogleDriveSpace, fileId: string): Promise<string> {
        const token = await this.getToken();
        if (!token) throw new Error('No auth token available');
        const params = new URLSearchParams();
        params.set('alt', 'media');
        if (space.id === 'appDataFolder') params.set('spaces', 'appDataFolder');
        const response = await fetch(`${GoogleDriveFileService.API_BASE}/${fileId}?${params.toString()}`, {
            headers: {
                Authorization: `Bearer ${token.token}`,
            }
        });
        if (!response.ok) {
            throw new Error(`Error reading Google Drive file: ${response.status} ${response.statusText}`);
        }
        return await response.text();
    }

    private async createFile(space: GoogleDriveSpace, name: string, content: string, parentFolderId?: string): Promise<FileResponse> {
        if (space.id === 'appDataFolder' && parentFolderId) throw new Error('Cannot specify parent folder when creating file in App Data Folder');
        if (space.id === 'sharedWithMe' && !parentFolderId) throw new Error('Must specify parent folder when creating file in Shared With Me');
        if (space.id === 'drive' && !parentFolderId) parentFolderId = 'root';

        const token = await this.getToken();
        if (!token) throw new Error('No auth token available');

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
            headers: { Authorization: `Bearer ${token.token}`, },
            body: form,
        });
        if (!response.ok) {
            const res = await response.text();
            console.error('Create file response:', res);
            throw new Error(`Failed to upload file: ${response.statusText}`);
        }

        const responseData = await response.json() as FileResponse;
        this.addToFileMap(space.id, parentFolderId || 'root', responseData);
        return responseData;
    }

    private async updateFile(space: GoogleDriveSpace, fileId: string, fileName: string, content: string): Promise<FileResponse> {
        const token = await this.getToken();
        if (!token) throw new Error('No auth token available');

        const metadata: Metadata = {
            name: fileName,
            mimeType: 'text/plain',
        };
        if (space.id === 'appDataFolder') metadata['parents'] = ['appDataFolder'];
        const fileBlob = new Blob([content], { type: 'text/plain' });
        const formData = new FormData();
        formData.append('metadata', new Blob([Utils.stringifyJson(metadata)], { type: 'application/json' }));
        formData.append('file', fileBlob);

        const params = new URLSearchParams();
        params.set('uploadType', 'multipart');

        const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?${params.toString()}`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${token.token}`,
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Error updating Google Drive file: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    }

    private async deleteFile(space: GoogleDriveSpace, fileId: string): Promise<void> {
        const token = await this.getToken();
        if (!token) throw new Error('No auth token available');
        const params = new URLSearchParams();
        if (space.id === 'appDataFolder') params.set('spaces', 'appDataFolder');
        const response = await fetch(`${GoogleDriveFileService.API_BASE}/${fileId}?${params.toString()}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token.token}`,
            }
        });
        if (!response.ok) {
            throw new Error(`Error deleting Google Drive file: ${response.status} ${response.statusText}`);
        }
        return;
    }

    private addToFileMap(spaceId: GoogleDriveSpaceId, folderId: string, file: FileResponse) {
        if (!this.fileMap[spaceId]) this.fileMap[spaceId] = {};
        if (!this.fileMap[spaceId][folderId]) this.fileMap[spaceId][folderId] = {};
        this.fileMap[spaceId][folderId][file.name] = file.id;
    }

    private async ensureFileMapEntry(spaceId: GoogleDriveSpaceId, folderId: string, filename: string): Promise<void> {
        if (this.fileMap[spaceId]?.[folderId]?.[filename]) {
            return;
        }
        await this.getListing({ id: spaceId, displayName: '' }, folderId);
    }

    private async ensureConfig(): Promise<void> {
        if (this.config) return;
        await this.getConfig();
    }
}
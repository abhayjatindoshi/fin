// import type { AuthConfig } from "@/modules/auth/AuthProvider";
// import type { Token } from "@/modules/auth/types";
// import { Utils } from "@/modules/common/Utils";
// import type { EntityKeyData } from "@/modules/data-sync/interfaces/types";
// import { ICloudService } from "../ICloudService";
// import type { Config, DriveEntry, Folder, Household, Space } from "../types";

// // (Reserved) type GDriveSpace = 'drive' | 'appDataFolder' | 'sharedWithMe';

// type FileApiResponse = {
//     files: Array<File>;
//     nextPageToken?: string;
// }

// type File = {
//     id: string;
//     name: string;
//     mimeType?: string;
//     parents?: string[];
// };

// type Metadata = {
//     name: string;
//     mimeType: string;
//     parents?: string[];
// }

// export class GoogleDriveService implements ICloudService {

//     static authConfig: AuthConfig = {
//         type: 'google',
//         clientId: '8125620125-tkfb5448rfhk389h550ghpljk73ompe6.apps.googleusercontent.com',
//         scopes: [
//             'https://www.googleapis.com/auth/drive.file',
//             'https://www.googleapis.com/auth/drive.readonly',
//             'https://www.googleapis.com/auth/drive.appdata',
//         ]
//     };

//     private static apiRoot = 'https://www.googleapis.com/drive/v3/files';
//     private static appFolderName = 'appDataFolder';
//     // private static rootFolderName = 'root'; // not currently used
//     private static folderMimeType = 'application/vnd.google-apps.folder';
//     private static configFileName = 'config.json';

//     private fileMap: Record<string, File> = {};

//     private config: Config | undefined;
//     private getToken: () => Promise<Token | null>;

//     constructor(token: () => Promise<Token | null>) {
//         this.getToken = token;
//     }

//     // Required abstract contract implementations (not yet supported)
//     async isFolderEmpty(_space: Space, _folder: Folder): Promise<void> {
//         void _space; void _folder;
//         throw new Error('Not implemented');
//     }
//     async validateTenant(_tenant: Household): Promise<Error | undefined> {
//         void _tenant;
//         return new Error('Not implemented');
//     }

//     private async ensureConfig(): Promise<void> {
//         if (this.config) return;
//         await this.getConfig();
//     }

//     async loadData(key: string): Promise<EntityKeyData | null> {
//         const prefix = key.split('.')[0];
//         await this.ensureConfig();
//         const tenant = this.config!.tenants.find(t => t.id === prefix);
//         if (!tenant) return null;
//         await this.ensureFileMap(tenant, key);
//         const fileName = `${key}.json`;
//         const file = this.fileMap![fileName];
//         if (!file) {
//             return null;
//         }
//         const content = await this.read(file.id, tenant.location.space.id === 'appDataFolder' ? 'appDataFolder' : undefined);
//         return Utils.parseJson(content);
//     }

//     private async read(fileId: string, space?: string): Promise<string> {
//         const authHeader = await this.authHeader();
//         const params = new URLSearchParams();
//         params.set('alt', 'media');
//         if (space) params.set('spaces', space);
//         const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
//             method: 'GET',
//             headers: {
//                 Authorization: authHeader,
//             },
//         });
//         if (!response.ok) {
//             const res = await response.text();
//             console.error('Read file response:', res);
//             throw new Error(`Failed to read file: ${response.statusText}`);
//         }
//         return await response.text();
//     }
//     async storeData(key: string, data: EntityKeyData): Promise<void> {
//         const prefix = key.split('.')[0];
//         await this.ensureConfig();
//         const tenant = this.config!.tenants.find(t => t.id === prefix);
//         if (!tenant) return;
//         await this.ensureFileMap(tenant, key);
//         const content = Utils.stringifyJson(data);
//         const fileName = `${key}.json`;
//         if (this.fileMap![fileName]) {
//             try {
//                 console.log('Updating existing file', fileName, this.fileMap![fileName]);
//                 await this.update(this.fileMap![fileName].id, fileName, content);
//                 return;
//             } catch (e) {
//                 console.error('Failed to update file, trying to delete', e);
//                 try {
//                     await this.delete(this.fileMap![fileName].id);
//                 } catch (e) {
//                     console.error('Failed to delete file, giving up', e);
//                 }
//             }
//         }
//         console.log('Creating new file', fileName);
//         const fileId = await this.create(fileName, content);
//         this.fileMap![fileName] = fileId;

//     }
//     async clearData(_key: string): Promise<void> {
//         void _key;
//         throw new Error('Not implemented');
//     }

//     private async ensureFileMap(tenant: Household, key: string) {
//         const fileName = tenant.location.folder ? `${tenant.location.space.id}#${tenant.location.folder.id}#${key}` : `${tenant.location.space.id}#${key}`;
//         if (this.fileMap[fileName]) return;
//         await this.listEntries(tenant.location.space, tenant.location.folder);
//     }


//     async getConfig(): Promise<Config | null> {
//         if (this.config) return this.config;
//         const file = await this.getFileIdByName(GoogleDriveService.configFileName, GoogleDriveService.appFolderName);
//         if (!file) {
//             this.config = { tenants: [] };
//             await this.saveConfig(this.config);
//             return this.config;
//         }
//         const blob = await this.readFile(file.id);
//         const text = await blob.text();
//         this.config = Utils.parseJson<Config>(text);
//         return this.config;
//     }

//     private async delete(fileId: string): Promise<void> {
//         const response = await window.gapi.client.drive.files.delete({
//             fileId,
//         });
//         if (response.body !== "") {
//             console.error('Delete file response:', JSON.stringify(response));
//             // throw new Error(`Failed to delete file: ${response.statusText}`);
//         }
//     }

//     async saveConfig(config: Config): Promise<void> {
//         const file = await this.getFileIdByName(GoogleDriveService.configFileName, GoogleDriveService.appFolderName);
//         if (file) {
//             await this.update(file.id, GoogleDriveService.configFileName, Utils.stringifyJson(config));
//         } else {
//             await this.create(GoogleDriveService.configFileName, Utils.stringifyJson(config), GoogleDriveService.appFolderName);
//         }
//     }

//     getSpaces = async (): Promise<Space[]> => ([
//         { id: 'drive', displayName: 'My Drive' },
//         { id: 'appDataFolder', displayName: 'App Data Folder' },
//         { id: 'sharedWithMe', displayName: 'Shared with me' },
//     ])

//     async getFolders(space: Space, search?: string, parentFolder?: Folder): Promise<Array<Folder>> {
//         const authHeader = await this.authHeader();
//         const params = new URLSearchParams();
//         params.set('fields', 'files(id, name, parents)');
//         const query = [];
//         if (search) query.push(`name contains '${search.replace("'", "\\'")}'`);
//         if (parentFolder) {
//             query.push(`'${parentFolder.id}' in parents`);
//         } else if (space.id === 'drive') {
//             // Limit to root-level items in My Drive when no parent folder supplied
//             query.push(`'root' in parents`);
//         }
//         // query.push(`mimeType='${GoogleDriveService.folderMimeType}'`);
//         query.push('trashed=false');
//         params.set('q', query.join(' and '));
//         this.setSpaceParams(space, params);
//         const response = await fetch(`${GoogleDriveService.apiRoot}?${params.toString()}`, {
//             method: 'GET',
//             headers: { Authorization: authHeader },
//         });
//         if (!response.ok) throw new Error(`Failed to get folders: ${response.statusText}`);
//         const result = await response.json() as FileApiResponse;
//         return result.files.map(f => ({ id: f.id, displayName: f.name }));
//     }

//     async createNewFolder(name: string, space: Space, parentFolder?: Folder): Promise<Folder> {
//         if (space.id !== 'drive') throw new Error('Cannot create folder in selected space.');
//         const authHeader = await this.authHeader();
//         const response = await fetch(`${GoogleDriveService.apiRoot}`, {
//             method: 'POST',
//             headers: {
//                 Authorization: authHeader,
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({
//                 name,
//                 mimeType: GoogleDriveService.folderMimeType,
//                 parents: parentFolder ? [parentFolder.id] : []
//             }),
//         });
//         if (!response.ok) throw new Error(`Failed to create folder: ${response.statusText}`);
//         const result = await response.json() as File;
//         return { id: result.id, displayName: result.name };
//     }

//     async listEntries(space: Space, parentFolder?: Folder, search?: string): Promise<DriveEntry[]> {
//         const authHeader = await this.authHeader();
//         const params = new URLSearchParams();
//         params.set('fields', 'files(id,name,parents,mimeType)');
//         const query: string[] = [];
//         if (search) query.push(`name contains '${search.replace("'", "\\'")}'`);
//         if (parentFolder) {
//             query.push(`'${parentFolder.id}' in parents`);
//         } else if (space.id === 'drive') {
//             // Only root-level items in My Drive when at the top
//             query.push(`'root' in parents`);
//         }
//         query.push('trashed=false');
//         params.set('q', query.join(' and '));
//         this.setSpaceParams(space, params);
//         const response = await fetch(`${GoogleDriveService.apiRoot}?${params.toString()}`, {
//             method: 'GET',
//             headers: { Authorization: authHeader },
//         });
//         if (!response.ok) throw new Error(`Failed to list entries: ${response.statusText}`);
//         const result = await response.json() as FileApiResponse;
//         result.files.forEach(f => {
//             const fileName = parentFolder ? `${space.id}#${parentFolder.id}#${f.name}` : `${space.id}#${f.name}`;
//             this.fileMap[fileName] = f;
//         });
//         return result.files.map(f => ({
//             id: f.id,
//             displayName: f.name,
//             isFolder: f.mimeType === GoogleDriveService.folderMimeType,
//             mimeType: f.mimeType || '',
//         }));
//     }

//     private async getFileIdByName(name: string, spaces: string): Promise<File | null> {
//         const fileMapKey = `${spaces}:${name}`;
//         if (this.fileMap[fileMapKey]) return this.fileMap[fileMapKey];

//         const authHeader = await this.authHeader();
//         const params = new URLSearchParams();
//         params.set('spaces', spaces);
//         params.set('fields', 'files(id, name, parents, size)');
//         params.set('q', `name='${name.replace("'", "\\'")}' and trashed=false`);
//         const response = await fetch(`${GoogleDriveService.apiRoot}?${params.toString()}`, {
//             method: 'GET',
//             headers: { Authorization: authHeader },
//         });
//         if (!response.ok) throw new Error(`Failed to get file ID: ${response.statusText}`);
//         const result = await response.json() as FileApiResponse;
//         if (result.files.length > 0) {
//             result.files.forEach(file => {
//                 this.fileMap[`${spaces}:${file.name}`] = file;
//             });
//         }
//         return this.fileMap[fileMapKey] || null;
//     }

//     private async readFile(fileId: string): Promise<Blob> {
//         const authHeader = await this.authHeader();
//         const response = await fetch(`${GoogleDriveService.apiRoot}/${fileId}?alt=media`, {
//             method: 'GET',
//             headers: { Authorization: authHeader },
//         });
//         if (!response.ok) throw new Error(`Failed to read file: ${response.statusText}`);
//         return await response.blob();
//     }

//     private async create(name: string, content: string, parent?: string): Promise<File> {
//         const token = await this.authHeader();
//         const file = new Blob([content], { type: 'text/plain' });
//         const metadata: Metadata = {
//             name,
//             mimeType: 'text/plain',
//         };
//         if (parent) metadata['parents'] = [parent];
//         const form = new FormData();
//         form.append('metadata', new Blob([Utils.stringifyJson(metadata)], { type: 'application/json' }));
//         form.append('file', file);

//         // Use fetch to upload the file to Google Drive
//         const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
//             method: 'POST',
//             headers: { Authorization: token, },
//             body: form,
//         });
//         if (!response.ok) {
//             const res = await response.text();
//             console.error('Create file response:', res);
//             throw new Error(`Failed to upload file: ${response.statusText}`);
//         }
//         return await response.json() as File;
//     }

//     private async update(fileId: string, fileName: string, content: string): Promise<File> {
//         const token = await this.authHeader();
//         const file = new Blob([content], { type: 'text/plain' });
//         const metadata: Metadata = {
//             name: fileName,
//             mimeType: 'text/plain',
//         };
//         const form = new FormData();
//         form.append('metadata', new Blob([Utils.stringifyJson(metadata)], { type: 'application/json' }));
//         form.append('file', file);

//         // Use fetch to upload the file to Google Drive
//         const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`, {
//             method: 'PATCH',
//             headers: { Authorization: token, },
//             body: form,
//         });
//         if (!response.ok) {
//             const res = await response.text();
//             console.error('Create file response:', res);
//             throw new Error(`Failed to upload file: ${response.statusText}`);
//         }
//         return await response.json() as File;
//     }


//     private async updateFile(fileId: string, name: string, content: Blob): Promise<void> {
//         const authHeader = await this.authHeader();
//         const metadata: Metadata = {
//             name,
//             mimeType: content.type,
//         };
//         const form = new FormData();
//         form.append('metadata', new Blob([Utils.stringifyJson(metadata)], { type: 'application/json' }));
//         form.append('file', content);
//         const response = await fetch(`${GoogleDriveService.apiRoot}/${fileId}?uploadType=multipart`, {
//             method: 'PATCH',
//             headers: { Authorization: authHeader },
//             body: form,
//         });
//         if (!response.ok) throw new Error(`Failed to update file: ${response.statusText}`);
//     }

//     private async authHeader(): Promise<string> {
//         const token = await this.getToken();
//         if (!token) throw new Error('No auth token available');
//         return `Bearer ${token.token}`;
//     }

//     private setSpaceParams(space: Space, params: URLSearchParams) {
//         switch (space.id) {
//             case 'appDataFolder':
//                 params.set('spaces', 'appDataFolder');
//                 break;
//             case 'drive': {
//                 const q = params.get('q');
//                 if (q) {
//                     params.set('q', `${q} and 'me' in owners`);
//                 } else {
//                     params.set('q', `'me' in owners`);
//                 }
//                 params.set('spaces', 'drive');
//                 break;
//             }
//             case 'sharedWithMe': {
//                 const q = params.get('q');
//                 if (q) {
//                     params.set('q', `${q} and sharedWithMe=true`);
//                 } else {
//                     params.set('q', 'sharedWithMe=true');
//                 }
//                 break;
//             }
//         }
//     }
// }
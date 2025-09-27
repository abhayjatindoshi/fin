import type { EntityKeyData } from "@/modules/store/interfaces/EntityKeyData";
import type { IPersistence } from "@/modules/store/interfaces/IPersistence";

export class DrivePersistence implements IPersistence {

    private clientId = '8125620125-tkfb5448rfhk389h550ghpljk73ompe6.apps.googleusercontent.com';
    private scope = 'https://www.googleapis.com/auth/drive.file'
    private discoveryDocs = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
    private gapi = window.gapi;
    private token?: google.accounts.oauth2.TokenClient;
    private accessToken?: string;


    async initialize(): Promise<void> {

        await this.waitForScriptLoad();

        const gapiPromise = new Promise((resolve) => {
            this.gapi.load('client', async () => {
                await this.gapi.client.init({
                    clientId: this.clientId,
                    discoveryDocs: this.discoveryDocs,
                });
                resolve(true);
            });
        });


        const tokenPromise = new Promise((resolve) => {
            this.token = google.accounts.oauth2.initTokenClient({
                client_id: this.clientId,
                scope: this.scope,
                callback: (resp) => {
                    this.accessToken = resp.access_token;
                    gapi.client.setToken({ access_token: resp.access_token });
                },
            });
            resolve(true);
        });

        await Promise.all([gapiPromise, tokenPromise]);
    }

    async waitForScriptLoad(): Promise<void> {
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                if (window.google && window.gapi) {
                    clearInterval(interval);
                    resolve();
                    return;
                }
            }, 100);
        });
    }

    async sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async login(): Promise<void> {
        if (!this.token) {
            await this.waitForScriptLoad();
        }
        this.token?.requestAccessToken({ prompt: 'none' });
    }

    async listFiles(): Promise<gapi.client.Response<gapi.client.drive.FileList>> {
        const result = await this.gapi.client.drive.files.list({
            pageSize: 10,
        });
        return result;
    }

    async createFile(name: string, content: string): Promise<void> {
        /**
         * Reads the content of a file from Google Drive by file ID.
         * @param fileId The ID of the file to read.
         * @returns The file content as a string.
         */
        // Create a Blob from the content
        const file = new Blob([content], { type: 'text/plain' });
        const metadata = {
            name,
            mimeType: 'text/plain',
        };
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', file);

        // Use fetch to upload the file to Google Drive
        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.accessToken}`,
            },
            body: form,
        });
        if (!response.ok) {
            throw new Error(`Failed to upload file: ${response.statusText}`);
        }
        const result = await response.json();
        this.fileIdMap[name] = result.id;
    }

    async readFile(fileId: string): Promise<string> {
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${this.accessToken}`,
            },
        });
        if (!response.ok) {
            throw new Error(`Failed to read file: ${response.statusText}`);
        }
        return await response.text();
    }

    private fileIdMap: Record<string, string> = {}; // key -> fileId

    async loadData(key: string): Promise<EntityKeyData | null> {
        const fileId = this.fileIdMap[key];
        if (!fileId) {
            return null;
        }
        const content = await this.readFile(fileId);
        return JSON.parse(content);
    }

    async storeData(key: string, data: EntityKeyData): Promise<void> {
        const content = JSON.stringify(data);
        await this.createFile(`${key}.json`, content);
    }
    clearData(key: string): Promise<void> {
        throw new Error("Method not implemented.");
    }

}
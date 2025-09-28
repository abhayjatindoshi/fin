import { Utils } from "@/modules/common/Utils";
import type { IPersistence } from "@/modules/data-sync/interfaces/IPersistence";
import type { EntityKeyData } from "@/modules/data-sync/interfaces/types";
import { GoogleDriveLogin } from "./GoogleDriveLogin";

export class DrivePersistence implements IPersistence {
    private static instance: DrivePersistence;
    static getInstance(): DrivePersistence {
        if (!this.instance) {
            this.instance = new DrivePersistence();
        }
        return this.instance;
    }

    private constructor() { }

    private fileMap: Record<string, string> | undefined;

    async ensureFileMap(): Promise<void> {
        if (this.fileMap) return;
        const result = await this.list(1000);
        this.fileMap = result.result.files?.reduce((map, file) => {
            if (file.name && file.id) {
                map[file.name] = file.id;
            }
            return map;
        }, {} as Record<string, string>) || {};
    }

    private async list(fileCount: number = 10): Promise<gapi.client.Response<gapi.client.drive.FileList>> {
        const result = await window.gapi.client.drive.files.list({
            pageSize: fileCount,
        });
        return result;
    }

    private async create(name: string, content: string): Promise<string> {
        const file = new Blob([content], { type: 'text/plain' });
        const metadata = {
            name,
            mimeType: 'text/plain',
        };
        const form = new FormData();
        form.append('metadata', new Blob([Utils.stringifyJson(metadata)], { type: 'application/json' }));
        form.append('file', file);

        // Use fetch to upload the file to Google Drive
        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${GoogleDriveLogin.getInstance().getToken()}`,
            },
            body: form,
        });
        if (!response.ok) {
            const res = await response.text();
            console.error('Create file response:', res);
            throw new Error(`Failed to upload file: ${response.statusText}`);
        }
        const result = await response.json();
        return result.id;
    }

    private async update(fileId: string, fileName: string, content: string): Promise<void> {
        const file = new Blob([content], { type: 'text/plain' });
        const metadata = {
            name: fileName,
            mimeType: 'text/plain',
        };
        const form = new FormData();
        form.append('metadata', new Blob([Utils.stringifyJson(metadata)], { type: 'application/json' }));
        form.append('file', file);
        const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${GoogleDriveLogin.getInstance().getToken()}`,
            },
            body: form,
        });
        if (!response.ok) {
            const res = await response.text();
            console.error('Update file response:', res);
            throw new Error(`Failed to update file: ${response.statusText}`);
        }
    }

    private async read(fileId: string): Promise<string> {
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${GoogleDriveLogin.getInstance().getToken()}`,
            },
        });
        if (!response.ok) {
            const res = await response.text();
            console.error('Read file response:', res);
            throw new Error(`Failed to read file: ${response.statusText}`);
        }
        return await response.text();
    }

    private async delete(fileId: string): Promise<void> {
        const response = await window.gapi.client.drive.files.delete({
            fileId,
        });
        if (response.body !== "") {
            console.error('Delete file response:', JSON.stringify(response));
            // throw new Error(`Failed to delete file: ${response.statusText}`);
        }
    }

    async loadData(key: string): Promise<EntityKeyData | null> {
        await this.ensureFileMap();
        const fileName = `${key}.json`;
        const fileId = this.fileMap![fileName];
        if (!fileId) {
            return null;
        }
        const content = await this.read(fileId);
        return Utils.parseJson(content);
    }

    async storeData(key: string, data: EntityKeyData): Promise<void> {
        await this.ensureFileMap();
        const content = Utils.stringifyJson(data);
        const fileName = `${key}.json`;
        if (this.fileMap![fileName]) {
            try {
                console.log('Updating existing file', fileName, this.fileMap![fileName]);
                await this.update(this.fileMap![fileName], fileName, content);
                return;
            } catch (e) {
                console.error('Failed to update file, trying to delete', e);
                try {
                    await this.delete(this.fileMap![fileName]);
                } catch (e) {
                    console.error('Failed to delete file, giving up', e);
                }
            }
        }
        console.log('Creating new file', fileName);
        const fileId = await this.create(fileName, content);
        this.fileMap![fileName] = fileId;
    }

    async clearData(key: string): Promise<void> {
        await this.ensureFileMap();
        const fileName = `${key}.json`;
        if (!this.fileMap![fileName]) return Promise.resolve();
        const fileId = this.fileMap![fileName];
        await this.delete(fileId);
    }

}
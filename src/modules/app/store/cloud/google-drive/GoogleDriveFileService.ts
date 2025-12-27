import type { Household } from "@/modules/app/entities/Household";
import { AuthMatrix } from "@/modules/auth/AuthMatrix";
import { GoogleDriveSpaceMap, type GoogleDriveHandler, type GoogleDriveSpace, type GoogleDriveSpaceId } from "@/modules/auth/handlers/google/GoogleDriveHandler";
import type { IAuthToken } from "@/modules/auth/interfaces/IAuthToken";
import { Utils } from "@/modules/common/Utils";
import type { Tenant } from "@/modules/data-sync/entities/Tenant";
import type { CloudFile, ICloudFileService } from "@/modules/data-sync/interfaces/ICloudFileService";
import type { IPersistence, TenantSettings } from "@/modules/data-sync/interfaces/IPersistence";
import type { EntityKeyData } from "@/modules/data-sync/interfaces/types";
import NameInputStep from "@/modules/data-sync/ui/NameInputStep";
import GoogleDriveFolderSelectionStep from "./GoogleDriveFolderSelectionStep";


export class GoogleDriveFileService implements ICloudFileService, IPersistence<Household> {
    private static instance: GoogleDriveFileService | null = null;

    public static load(getToken: () => Promise<IAuthToken | null>): GoogleDriveFileService {
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

    // space vs folderId vs filename vs fileId
    private fileMap: { [key in GoogleDriveSpaceId]?: Record<string, Record<string, string>> } = {};
    private getToken: () => Promise<IAuthToken | null>;
    private handler = AuthMatrix.Handlers['google-drive'] as GoogleDriveHandler;
    // private config: Config | null = null;
    private defaultHousehold: Household = {
        id: 'default',
        name: 'Default Household',
        spaceId: 'appDataFolder',
        folderId: undefined,
        folderName: undefined,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        version: 1,
    };

    tenantSettings: TenantSettings<Tenant> = {
        newForm: {
            title: 'New Household',
            description: 'Create a new household in Google Drive.',
            steps: [
                {
                    name: 'Name',
                    component: NameInputStep,
                },
                {
                    name: 'Folder Selection',
                    component: GoogleDriveFolderSelectionStep,
                }
            ]
        },
    }

    private constructor(getToken: () => Promise<IAuthToken | null>) {
        this.getToken = getToken;
    }

    getSpaces = (): Promise<GoogleDriveSpace[]> => this.token()
        .then(token => this.handler.getSpaces(token));

    getListing = (space: GoogleDriveSpace, folderId?: string, search?: string) => this.token()
        .then(token => this.handler.getFileListing(token, space, folderId, search)
            .then(this.processFiles(space.id, folderId || 'root')));

    createFolder = (space: GoogleDriveSpace, name: string, parentFolderId?: string): Promise<CloudFile> => this.token()
        .then(token => this.handler.createFolder(token, space, name, parentFolderId)
            .then(this.processFiles(space.id, parentFolderId || 'root')));

    async loadData(household: Household | null, key: string): Promise<EntityKeyData | null> {
        if (!household) household = this.defaultHousehold;
        const space = GoogleDriveSpaceMap[household.spaceId as GoogleDriveSpaceId];
        await this.ensureFileMapEntry(
            household.spaceId as GoogleDriveSpaceId,
            household.folderId || 'root', key);
        const fileId = this.fileMap[household.spaceId as GoogleDriveSpaceId]?.[household.folderId || 'root']?.[key];
        if (!fileId) return null;
        const token = await this.token();
        const content = await this.handler.readFile(token, space, fileId);
        return Utils.parseJson<EntityKeyData>(content);
    }

    async storeData(household: Household | null, key: string, data: EntityKeyData): Promise<void> {
        if (!household) household = this.defaultHousehold;
        const space = GoogleDriveSpaceMap[household.spaceId as GoogleDriveSpaceId];
        const content = Utils.stringifyJson(data);
        await this.ensureFileMapEntry(
            household.spaceId as GoogleDriveSpaceId,
            household.folderId || 'root', key);
        const fileId = this.fileMap[household.spaceId as GoogleDriveSpaceId]?.[household.folderId || 'root']?.[key];
        const token = await this.token();
        if (fileId) {
            await this.handler.updateFile(token, space, fileId, key, content);
        } else {
            await this.handler.createFile(token, space, key, content, household.folderId);
        }
    }

    async clearData(household: Household | null, key: string): Promise<void> {
        if (!household) household = this.defaultHousehold;
        const space = GoogleDriveSpaceMap[household.spaceId as GoogleDriveSpaceId];
        await this.ensureFileMapEntry(
            household.spaceId as GoogleDriveSpaceId,
            household.folderId || 'root', key);
        const fileId = this.fileMap[household.spaceId as GoogleDriveSpaceId]?.[household.folderId || 'root']?.[key];
        if (fileId) {
            const token = await this.token();
            await this.handler.deleteFile(token, space, fileId);
        }
    }

    private async token(): Promise<IAuthToken> {
        const token = await this.getToken();
        if (!token) throw new Error('No auth token available');
        return token;
    }

    private processFiles<T extends CloudFile | CloudFile[]>(spaceId: GoogleDriveSpaceId, folderId: string): (files: T) => T {
        return ((files: T) => {
            if (Array.isArray(files)) {
                files.forEach(f => this.addToFileMap(spaceId, folderId, f));
            } else {
                this.addToFileMap(spaceId, folderId, files);
            }
            return files;
        }).bind(this);
    }

    private addToFileMap(spaceId: GoogleDriveSpaceId, folderId: string, file: CloudFile) {
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
}
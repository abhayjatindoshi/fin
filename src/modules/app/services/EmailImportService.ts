import { EntityName } from "../entities/entities";
import { SyncSettingsSchema, type SyncSettings } from "../entities/SyncSettings";
import { BaseService } from "./BaseService";

export class EmailImportService extends BaseService {

    private static DEFAULT_SYNC_SETTINGS: SyncSettings = SyncSettingsSchema.parse({
        authAccountId: '',
        syncInterval: 1440, // default to 1 day
        lastSyncAt: new Date(0),
    });

    async setConfig(settings: Partial<SyncSettings>): Promise<void> {
        if (!settings.authAccountId) throw new Error('authAccountId is required');
        const repo = this.repository(EntityName.SyncSettings);
        const existing = await this.getSyncSettings(settings.authAccountId);
        let finalSettings = {
            ...EmailImportService.DEFAULT_SYNC_SETTINGS,
        }
        if (existing) {
            finalSettings = {
                ...finalSettings,
                ...existing,
            }
        }
        finalSettings = {
            ...finalSettings,
            ...settings,
        }
        repo.save(finalSettings);
    }

    async syncNow(accountId: string): Promise<void> {
        const accountRepo = this.repository(EntityName.AuthAccount);
        const account = await accountRepo.get(accountId);
        if (!account) throw new Error('Account not found');

        const settings = await this.getSyncSettings(accountId);
        if (!settings) throw new Error('Sync settings not found');

        // check if sync can happen.




    }

    private async getSyncSettings(accountId: string): Promise<SyncSettings | null> {
        const repo = this.repository(EntityName.SyncSettings);
        const existing = await repo.getAll({ where: { authAccountId: accountId } }) as SyncSettings[];
        if (existing.length > 0) {
            return existing[0];
        }
        return null;
    }
}
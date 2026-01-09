// import { AuthMatrix } from "@/modules/auth/AuthMatrix";
// import type { IAuthMailHandler, MailAttachment, MailMessage } from "@/modules/auth/interfaces/features/IAuthMailHandler";
// import type { AuthAccount } from "../entities/AuthAccount";
// import { EntityName } from "../entities/entities";
// import { ImportMatrix } from "../import/ImportMatrix";
// import type { IEmailImportAdapter } from "../import/interfaces/IEmailImportAdapter";
// import { AppLogger } from "../logging/AppLogger";
// import { AuthService } from "./AuthService";
// import { BaseService } from "./BaseService";
// import { ImportService, type ImportResult } from "./ImportService";

// export class EmailImportService extends BaseService {

//     private static DEFAULT_SYNC_SETTINGS: SyncSettings = SyncSettingsSchema.parse({
//         authAccountId: '',
//         syncInterval: 1440, // default to 1 day
//         lastSyncAt: new Date(0),
//     });

//     private static syncPromises: Record<string, Promise<void>> = {};
//     private logger = AppLogger.tagged(this.constructor.name);
//     private authService = new AuthService();
//     private importService = new ImportService();

//     async setConfig(settings: Partial<SyncSettings>): Promise<void> {
//         if (!settings.authAccountId) throw new Error('authAccountId is required');
//         const repo = this.repository(EntityName.SyncSettings);
//         const existing = await this.getSyncSettings(settings.authAccountId);
//         let finalSettings = {
//             ...EmailImportService.DEFAULT_SYNC_SETTINGS,
//         }
//         if (existing) {
//             finalSettings = {
//                 ...finalSettings,
//                 ...existing,
//             }
//         }
//         finalSettings = {
//             ...finalSettings,
//             ...settings,
//         }
//         repo.save(finalSettings);
//     }

//     async syncNow(accountId: string): Promise<void> {
//         const accountRepo = this.repository(EntityName.AuthAccount);
//         const account = await accountRepo.get(accountId);
//         if (!account) throw new Error('Account not found');

//         const settings = await this.getSyncSettings(accountId);
//         if (!settings) throw new Error('Sync settings not found');

//         let syncPromise = EmailImportService.syncPromises[accountId];
//         if (!syncPromise) {
//             syncPromise = this.performSync(account as AuthAccount, settings);
//             EmailImportService.syncPromises[accountId] = syncPromise;
//         }
//         return EmailImportService.syncPromises[accountId];
//     }

//     private async performSync(account: AuthAccount, settings: SyncSettings): Promise<void> {
//         if (!settings.id) throw new Error('Sync settings must have an ID');
//         this.logger.i(`Starting sync for account ${account}`);
//         let status = settings.syncStatus;

//         if (status.currentSyncPoint) {
//             this.logger.i(`Resuming sync from email ID ${status.currentSyncPoint.id} at ${status.currentSyncPoint.date}`);
//         } else {
//             this.logger.i(`Starting new sync for account ${account}`);
//         }

//         const handler = AuthMatrix.FeatureHandlers['mail'][account.token.handlerId] as IAuthMailHandler;
//         const householdId = this.currentHouseholdId();
//         if (!householdId) throw new Error('No current household context for sync');
//         let nextPageToken: string | undefined = undefined;
//         do {

//             const validToken = await this.authService.getValidToken(account.token, householdId);
//             const mailListing = await handler.getMailListing(validToken, nextPageToken ? undefined : status.currentSyncPoint, nextPageToken);
//             nextPageToken = mailListing.nextPageToken;

//             if (status.startSyncPoint === undefined && mailListing.messages.length > 0) {
//                 status = await this.updateSyncStatus(settings.id, {
//                     startSyncPoint: {
//                         id: mailListing.messages[0].id,
//                         date: mailListing.messages[0].date,
//                     }
//                 });
//             }

//             let importedEmailCount = 0;

//             try {
//                 for (const message of mailListing.messages) {

//                     if (status.endSyncPoint && message.id === status.endSyncPoint.id) {
//                         this.logger.i(`Reached end sync point at email ID ${message.id}. Ending sync.`);
//                         nextPageToken = undefined;
//                         break;
//                     }

//                     this.logger.d(`Fetched email: ${message.subject} from ${message.from}`);

//                     const adapters = await this.getSupportedMailAdapters(message);
//                     if (adapters.length === 0) continue;

//                     for (const adapter of adapters) {
//                         const importData = await adapter.readEmail(message);
//                         if (!importData) continue;

//                         if (importData instanceof Array) {
//                             const attachments = importData as MailAttachment[];
//                             for (const attachment of attachments) {
//                                 const validToken = await this.authService.getValidToken(account.token, householdId);
//                                 const file = await handler.fetchAttachment(validToken, message.id, attachment);
//                                 const importFile = await this.importService.readFile(file);
//                                 if (importFile === null) continue;
//                                 if ('message' in importFile) {
//                                     throw {
//                                         code: 'password_required',
//                                         message: `Password required for file ${attachment.filename} in email ${message.subject}`,
//                                     };
//                                 }

//                                 const supportedAdapters = this.importService.getSupportedFileAdapters(importFile);

//                                 for (const fileAdapter of supportedAdapters) {
//                                     const result = await this.importService.importFile(importFile, fileAdapter);
//                                     if (result instanceof Error) {
//                                         this.logger.w(`Import error for file ${attachment.filename} in email ${message.subject}: ${result.message}`);
//                                         continue;
//                                     }

//                                     result.importSource = {
//                                         type: 'email',
//                                         authAccountId: account.id!,
//                                         emailMessage: {
//                                             id: message.id,
//                                             date: message.date,
//                                             from: message.from,
//                                             subject: message.subject,
//                                         }
//                                     }

//                                     const accounts = result.importedAccounts;
//                                     for (const acc of accounts) {
//                                         result.importedAccounts = [acc];
//                                         await this.importService.applyImport(result);
//                                         this.logger.i(`Imported data from file ${attachment.filename} in email ${message.subject}`);
//                                     }
//                                 }
//                             }
//                         } else {
//                             if (importData instanceof Error) {
//                                 this.logger.w(`Import error for email ${message.subject}: ${importData.message}`);
//                                 continue;
//                             }

//                             const [bank, offering] = ImportMatrix.AdapterBankData[adapter.id];
//                             const matchingAccounts = await this.importService.findMatchingAccounts(bank, offering, importData);
//                             const parsedTransactions = await this.importService.parseTransactions(importData.transactions);
//                             for (const acc of matchingAccounts) {
//                                 const result: ImportResult = {
//                                     importSource: {
//                                         type: 'email',
//                                         authAccountId: account.id!,
//                                         emailMessage: {
//                                             id: message.id,
//                                             date: message.date,
//                                             from: message.from,
//                                             subject: message.subject,
//                                         }
//                                     },
//                                     importedAccounts: [acc],
//                                     importedTransactions: parsedTransactions,
//                                 }

//                                 await this.importService.applyImport(result);
//                             }
//                         }
//                     }

//                     importedEmailCount++;
//                 }
//             } catch (error) {
//                 if (error && typeof error === 'object' && 'code' in error) {
//                     this.logger.w(`Import error during email sync: ${(error as any).message || (error as any).code}`);
//                     status = await this.updateSyncStatus(settings.id, {
//                         lastError: {
//                             code: (error as any).code,
//                             message: (error as any).message,
//                         }
//                     });
//                 } else {
//                     throw error;
//                 }
//             }

//             // Update sync status
//             status = await this.updateSyncStatus(settings.id, {
//                 currentSyncPoint: {
//                     id: mailListing.messages[mailListing.messages.length - 1].id,
//                     date: mailListing.messages[mailListing.messages.length - 1].date,
//                 },
//                 syncedEmailCount: (status.syncedEmailCount || 0) + mailListing.messages.length,
//                 importedEmailCount: (status.importedEmailCount || 0) + importedEmailCount,
//                 lastSyncAt: new Date(),
//             });

//             await new Promise(resolve => setTimeout(resolve, 1 * 60 * 1000)); // wait for a minute
//         } while (nextPageToken);

//         status.endSyncPoint = status.startSyncPoint;
//         status.startSyncPoint = undefined;
//         status.currentSyncPoint = undefined;
//         await this.updateSyncStatus(settings.id, status);

//         this.logger.i(`Sync completed for account ${account}`);
//     }


//     private async getSupportedMailAdapters(email: MailMessage): Promise<IEmailImportAdapter[]> {
//         const adapters = Object.values(ImportMatrix.Adapters)
//             .filter(a => a.type === 'email')
//             .map(a => a as IEmailImportAdapter)
//             .filter(a => a.supportedEmailDomains.some(domain => email.from.endsWith(`@${domain}`)))
//         const supportedAdapters: IEmailImportAdapter[] = [];
//         for (const adapter of adapters) {
//             const isSupported = await adapter.isEmailSupported(email);
//             if (isSupported) supportedAdapters.push(adapter);
//         }
//         return supportedAdapters;
//     }

//     private async updateSyncStatus(settingsId: string, status: Partial<SyncStatus>): Promise<SyncStatus> {
//         const repo = this.repository(EntityName.SyncSettings);
//         const settings = await repo.get(settingsId) as SyncSettings;
//         if (!settings) throw new Error('Sync settings not found');
//         settings.syncStatus = { ...settings.syncStatus, ...status };
//         repo.save(settings);
//         return settings.syncStatus;
//     }

//     private async getSyncSettings(accountId: string): Promise<SyncSettings | null> {
//         const repo = this.repository(EntityName.SyncSettings);
//         const existing = await repo.getAll({ where: { authAccountId: accountId } }) as SyncSettings[];
//         if (existing.length > 0) {
//             return existing[0];
//         }
//         return null;
//     }
// }
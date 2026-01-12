import type { MailAttachment, MailMessage } from "@/modules/auth/interfaces/features/IAuthMailHandler";
import type { IImportAdapter } from "./IImportAdapter";
import type { ImportData } from "./ImportData";

export interface IEmailImportAdapter extends IImportAdapter {
    type: "email";
    supportedEmailDomains: string[];
    isEmailSupported: (email: MailMessage) => Promise<boolean>;
    readEmail: (email: MailMessage) => Promise<ImportData | MailAttachment[] | null>;
}
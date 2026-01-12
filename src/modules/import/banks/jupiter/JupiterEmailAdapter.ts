import type { MailAttachment, MailMessage } from "@/modules/auth/interfaces/features/IAuthMailHandler";
import type { IEmailImportAdapter } from "../../interfaces/IEmailImportAdapter";
import type { ImportData } from "../../interfaces/ImportData";

export class JupiterEmailAdapter implements IEmailImportAdapter {
    id = '';
    type: "email" = "email";
    supportedEmailDomains = ['jupiter.money'];

    async isEmailSupported(email: MailMessage): Promise<boolean> {
        return email.attachments.some(a =>
            a.mimeType === 'application/pdf' ||
            a.filename.toLowerCase().endsWith('.pdf'));
    }

    async readEmail(email: MailMessage): Promise<ImportData | MailAttachment[] | null> {
        const pdfAttachments = email.attachments.filter(a =>
            a.mimeType === 'application/pdf' ||
            a.filename.toLowerCase().endsWith('.pdf'));
        if (pdfAttachments.length === 0) return null;
        return pdfAttachments;
    }
}
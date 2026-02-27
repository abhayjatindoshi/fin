import type { MailAttachment, MailMessage } from "@/modules/auth/interfaces/features/IAuthMailHandler";
import type { IEmailImportAdapter } from "../../interfaces/IEmailImportAdapter";
import type { ImportData } from "../../interfaces/ImportData";

export class HdfcBankEmailAdapter implements IEmailImportAdapter {
    id = '';
    type: "email" = "email"
    supportedEmailDomains = ['hdfcbank.bank.in', 'hdfcbank.net'];

    private isCreditCard: boolean = false;

    constructor(offering: 'savings-account' | 'credit-card') {
        this.isCreditCard = offering === 'credit-card';
    }

    async isEmailSupported(email: MailMessage): Promise<boolean> {
        if (!email.attachments.some(a =>
            a.mimeType === 'application/pdf' ||
            a.filename.toLowerCase().endsWith('.pdf')
        )) return false;

        const subject = email.subject.toLowerCase();
        if (this.isCreditCard) {
            return subject.includes('credit card statement') ||
                (email.from.includes('statement') && subject.includes('credit card'));
        } else {
            return email.from.includes('statement') &&
                !subject.includes('credit card');
        }
    }

    async readEmail(email: MailMessage): Promise<ImportData | MailAttachment[] | null> {
        const pdfAttachments = email.attachments.filter(a =>
            a.mimeType === 'application/pdf' ||
            a.filename.toLowerCase().endsWith('.pdf'));
        if (pdfAttachments.length === 0) return null;
        return pdfAttachments;
    }
}
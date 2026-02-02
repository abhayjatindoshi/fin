import type { MailAttachment, MailMessage } from "@/modules/auth/interfaces/features/IAuthMailHandler";
import type { IEmailImportAdapter } from "../../interfaces/IEmailImportAdapter";
import type { ImportData } from "../../interfaces/ImportData";

export class PaytmBankEmailAdapter implements IEmailImportAdapter {
    id = '';
    type: "email" = "email"
    supportedEmailDomains = ['paytmbank.com'];

    private isWallet: boolean = false;

    constructor(offering: 'savings-account' | 'wallet') {
        this.isWallet = offering === 'wallet';
    }

    async isEmailSupported(email: MailMessage): Promise<boolean> {
        if (!email.attachments.some(a =>
            a.mimeType === 'application/pdf' ||
            a.filename.toLowerCase().endsWith('.pdf')
        )) return false;


        if (this.isWallet) {
            return email.subject.toLowerCase().includes('paytm wallet statement') ||
                email.subject.toLowerCase().includes('paytm payments bank wallet statement');
        } else {
            return email.subject.toLowerCase().includes('paytm payments bank statement')
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
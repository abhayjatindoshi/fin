import type { IAuthFeatureHandler } from "./IAuthFeatureHandler";

export type MailMessage = {
    id: string;
    subject: string;
    from: string;
    to: string[];
    cc: string[];
    date: Date;
    snippet: string;
    body: string;
    attachments: MailAttachment[];
}

export type MailAttachment = {
    id: string;
    filename: string;
    mimeType: string;
    size: number;
}

export interface IAuthMailHandler extends IAuthFeatureHandler {
    featureName: 'mail';
}
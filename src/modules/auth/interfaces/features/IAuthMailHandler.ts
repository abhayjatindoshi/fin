import type { IAuthToken } from "../IAuthToken";
import type { IAuthFeatureHandler } from "./IAuthFeatureHandler";

export type MailListing = {
    messages: MailMessage[];
    nextPageToken?: string;
}

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
    getMailListing(token: IAuthToken, emailsBefore?: { date: Date, id: string }, nextToken?: string): Promise<MailListing>;
    fetchMessages(token: IAuthToken, messageIds: string[]): Promise<MailMessage[]>;
    fetchAttachment(token: IAuthToken, messageId: string, attachment: MailAttachment): Promise<File>;
}
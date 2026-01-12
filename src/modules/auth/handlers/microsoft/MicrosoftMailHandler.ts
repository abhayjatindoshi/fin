import moment from "moment";
import type { IAuthMailHandler, MailAttachment, MailListing, MailMessage } from "../../interfaces/features/IAuthMailHandler";
import type { IAuthToken } from "../../interfaces/IAuthToken";
import { MicrosoftHandler } from "./MicrosoftHandler";

type MessageListResponse = {
    value: MessageResponse[];
    '@odata.nextLink'?: string;
}

type MessageResponse = {
    id: string;
    receivedDateTime: string;
    subject: string;
    bodyPreview: string;
    body: {
        contentType: string;
        content: string;
    }
    sender: MailAddress
    from: MailAddress;
    toRecipients: MailAddress[],
    ccRecipients: MailAddress[],
    bccRecipients: MailAddress[],
    attachments: AttachmentResponse[];
}

type MailAddress = {
    emailAddress: {
        name: string;
        address: string;
    }
}

type AttachmentResponse = {
    id: string;
    name: string;
    contentType: string;
    size: number;
}

export class MicrosoftMailHandler extends MicrosoftHandler implements IAuthMailHandler {
    featureName: 'mail' = 'mail';
    scopes = [
        'offline_access',
        'User.Read',
        'Mail.Read',
    ];
    timeoutInMs = 5 * 1000; // 5 seconds

    private API_BASE = 'https://graph.microsoft.com/v1.0/me/messages';

    async getMailListing(token: IAuthToken, domains: string[], emailsBefore?: { date: Date, id: string }, nextToken?: string): Promise<MailListing> {
        const validToken = await this.getValidToken(token);
        const params = new URLSearchParams();

        if (emailsBefore) {
            emailsBefore.date = moment(emailsBefore.date).add(1, 'day').toDate();
        } else {
            emailsBefore = { date: moment().add(1, 'day').toDate(), id: '' };
        }

        params.set('$top', '50');
        params.set('$orderby', 'receivedDateTime DESC');
        params.set('$expand', 'attachments($select=id,name,contentType,size,isInline,lastModifiedDateTime)');
        params.set('$filter', `receivedDateTime le ${emailsBefore.date.toISOString()}`);
        params.set('$filter', `${params.get('$filter')} and (${domains.map(d => `contains(from/emailAddress/address,'${d}')`).join(' or ')})`);

        let data: MessageListResponse = { value: [] };
        let currentPageToken = nextToken;
        let foundMessage = false;
        let lookupCount = 0;
        const maxLookups = 5;

        do {
            const url = currentPageToken || `${this.API_BASE}?${params.toString()}`;
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${validToken.accessToken}`,
                },
            });

            const pageData = await response.json() as MessageListResponse;

            if (emailsBefore) {
                const messageIndex = pageData.value.findIndex(m => new Date(m.receivedDateTime).getTime() <= emailsBefore.date.getTime());
                if (messageIndex !== -1) {
                    data.value = pageData.value.slice(messageIndex);
                    data['@odata.nextLink'] = pageData['@odata.nextLink'];
                    foundMessage = true;
                    break;
                }
                lookupCount++;
                currentPageToken = pageData['@odata.nextLink'];
            } else {
                data = pageData;
                break;
            }
        } while (emailsBefore && currentPageToken && lookupCount < maxLookups && !foundMessage);

        if (emailsBefore && !foundMessage) {
            return { messages: [], nextPageToken: undefined };
        }

        if (!data.value) data.value = [];
        return { messages: data.value.map(this.parseMailMessage), nextPageToken: data['@odata.nextLink'] };
    }

    async fetchMessages(token: IAuthToken, messageIds: string[]): Promise<MailMessage[]> {
        const validToken = await this.getValidToken(token);
        const messages: MailMessage[] = [];
        const params = new URLSearchParams();
        params.set('$expand', 'attachments($select=id,name,contentType,size,isInline,lastModifiedDateTime)');

        for (const messageId of messageIds) {

            const response = await fetch(`${this.API_BASE}/${messageId}?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${validToken.accessToken}`,
                },
            });

            const responseData = await response.json() as MessageResponse;
            messages.push(this.parseMailMessage(responseData));
        }

        return messages;
    }

    async fetchAttachment(token: IAuthToken, messageId: string, attachment: MailAttachment): Promise<File> {
        const validToken = await this.getValidToken(token);
        const response = await fetch(`${this.API_BASE}/${messageId}/attachments/${attachment.id}`, {
            headers: {
                Authorization: `Bearer ${validToken.accessToken}`,
            },
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch attachment: ${response.statusText}`);
        }
        const responseData = await response.json() as { contentBytes: string };
        const byteCharacters = atob(responseData.contentBytes.replace(/-/g, '+').replace(/_/g, '/'));
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const file = new File([byteArray], attachment.filename, { type: attachment.mimeType });
        return file;
    }

    private parseMailMessage(data: MessageResponse): MailMessage {
        return {
            id: data.id,
            subject: data.subject,
            from: data.from.emailAddress.address,
            to: data.toRecipients.map(r => r.emailAddress.address),
            cc: data.ccRecipients.map(r => r.emailAddress.address),
            date: new Date(data.receivedDateTime),
            snippet: data.bodyPreview,
            body: data.body.content,
            attachments: data.attachments.map(att => ({
                id: att.id,
                filename: att.name,
                size: att.size,
                mimeType: att.contentType,
            })),
        };
    }
}
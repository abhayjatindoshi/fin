import moment from "moment";
import type { IAuthMailHandler, MailAttachment, MailListing, MailMessage } from "../../interfaces/features/IAuthMailHandler";
import type { IAuthToken } from "../../interfaces/IAuthToken";
import { GoogleHandler } from "./GoogleHandler";

type MessageListResponse = {
    messages: Array<{ id: string; threadId: string }>;
    nextPageToken?: string;
}

type MessageResponse = {
    id: string;
    threadId: string;
    labelIds: string[];
    snippet: string;
    payload: MessagePart;
    sizeEstimate: number;
    historyId: string;
    internalDate: string;
}

type MessageHeaders = {
    name: string;
    value: string;
}

type MessageBody = {
    attachmentId?: string;
    size: number;
    data?: string;
}

type MessagePart = {
    partId: string;
    mimeType: string;
    filename: string;
    headers: MessageHeaders[];
    body: MessageBody;
    parts?: MessagePart[];
}

type AttachmentResponse = {
    data: string;
    size: number;
}

export class GoogleMailHandler extends GoogleHandler implements IAuthMailHandler {
    featureName: 'mail' = 'mail';
    scopes = [
        'openid', 'email', 'profile',
        'https://www.googleapis.com/auth/gmail.readonly',
    ];
    private API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me/messages';

    async getMailListing(token: IAuthToken, emailsBefore?: { date: Date, id: string }, nextToken?: string): Promise<MailListing> {
        const validToken = await this.getValidToken(token);
        const params = new URLSearchParams();
        params.set('maxResults', '20');
        if (emailsBefore) {
            const nextDay = moment(emailsBefore.date).add(1, 'day').format('YYYY/MM/DD');
            params.set('q', `before:${nextDay}`);
        }
        if (nextToken) {
            params.set('pageToken', nextToken);
        }
        let data: MessageListResponse = { messages: [] };
        let currentPageToken = nextToken;
        let foundMessage = false;
        let lookupCount = 0;
        const maxLookups = 5;

        do {
            if (currentPageToken) {
                params.set('pageToken', currentPageToken);
            } else {
                params.delete('pageToken');
            }

            const response = await fetch(`${this.API_BASE}?${params.toString()}`, {
                headers: {
                    Authorization: `Bearer ${validToken.accessToken}`,
                },
            });

            const pageData = await response.json() as MessageListResponse;

            if (emailsBefore) {
                const messageIndex = pageData.messages.findIndex(m => m.id === emailsBefore.id);
                if (messageIndex !== -1) {
                    data.messages = pageData.messages.slice(messageIndex + 1);
                    data.nextPageToken = pageData.nextPageToken;
                    foundMessage = true;
                    break;
                }
                lookupCount++;
                currentPageToken = pageData.nextPageToken;
            } else {
                data = pageData;
                break;
            }
        } while (emailsBefore && currentPageToken && lookupCount < maxLookups && !foundMessage);

        if (emailsBefore && !foundMessage) {
            return { messages: [], nextPageToken: undefined };
        }

        const messageIds = data.messages.map(m => m.id);
        const messages = await this.fetchMessages(validToken, messageIds);
        return { messages, nextPageToken: data.nextPageToken };
    }

    async fetchMessages(token: IAuthToken, messageIds: string[]): Promise<MailMessage[]> {
        const validToken = await this.getValidToken(token);
        const messages: MailMessage[] = [];

        // fetch messages using batch api with multipart/mixed
        const batchSize = 20;
        for (let i = 0; i < messageIds.length; i += batchSize) {
            const batch = messageIds.slice(i, i + batchSize);

            const boundary = `batch_${Date.now()}`;
            const batchBody = batch.map((id, index) =>
                `--${boundary}\r\n` +
                `Content-Type: application/http\r\n` +
                `Content-ID: <item${index}>\r\n\r\n` +
                `GET /gmail/v1/users/me/messages/${id}?format=full\r\n\r\n`
            ).join('') + `--${boundary}--`;

            const response = await fetch('https://gmail.googleapis.com/batch/gmail/v1', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${validToken.accessToken}`,
                    'Content-Type': `multipart/mixed; boundary=${boundary}`,
                },
                body: batchBody,
            });

            const responseText = await response.text();
            const parts = responseText.split(/--batch_/);

            for (const part of parts) {
                const jsonMatch = part.match(/\r\n\r\n(\{[\s\S]*\})/);
                if (jsonMatch) {
                    const data = JSON.parse(jsonMatch[1]) as MessageResponse;
                    messages.push(this.parseMailMessage(data));
                }
            }
        }

        return messages;


    }

    async fetchAttachment(token: IAuthToken, messageId: string, attachment: MailAttachment): Promise<File> {
        const validToken = await this.getValidToken(token);
        const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachment.id}`, {
            headers: {
                Authorization: `Bearer ${validToken.accessToken}`,
            },
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch attachment: ${response.statusText}`);
        }
        const responseData = await response.json<AttachmentResponse>();
        const byteCharacters = atob(responseData.data.replace(/-/g, '+').replace(/_/g, '/'));
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const file = new File([byteArray], attachment.filename, { type: attachment.mimeType });
        return file;
    }

    private parseMailMessage(data: MessageResponse): MailMessage {
        const getHeader = (name: string): string => {
            const header = data.payload.headers.find(h => h.name.toLowerCase() === name.toLowerCase());
            return header ? header.value : '';
        }

        const parseBody = (part: MessagePart): string => {
            if (part.body.data) {
                return atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
            } else if (part.parts) {
                for (const subPart of part.parts) {
                    const result = parseBody(subPart);
                    if (result) return result;
                }
            }
            return '';
        }

        const parseEmail = (emailStr: string): string => {
            const match = emailStr.match(/<(.+)>/);
            return match ? match[1] : emailStr;
        }

        const parseAtachments = (part: MessagePart): MailAttachment[] => {
            const attachments: MailAttachment[] = [];
            if (part.parts) {
                for (const subPart of part.parts) {
                    if (subPart.filename && subPart.body && subPart.body.attachmentId) {
                        attachments.push({
                            id: subPart.body.attachmentId,
                            filename: subPart.filename,
                            mimeType: subPart.mimeType,
                            size: subPart.body.size,
                        });
                    }
                    attachments.push(...parseAtachments(subPart));
                }
            }
            return attachments;
        }

        return {
            id: data.id,
            subject: getHeader('Subject'),
            from: parseEmail(getHeader('From')),
            to: getHeader('To').split(',').map(s => parseEmail(s.trim())),
            cc: getHeader('Cc').split(',').map(s => parseEmail(s.trim())),
            date: new Date(getHeader('Date')),
            snippet: data.snippet,
            body: parseBody(data.payload),
            attachments: parseAtachments(data.payload),
        };
    }
}
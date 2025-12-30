import moment from "moment";
import type { IAuthMailHandler, MailMessage } from "../../interfaces/features/IAuthMailHandler";
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

export class GoogleMailHandler extends GoogleHandler implements IAuthMailHandler {
    featureName: 'mail' = 'mail';
    scopes = [
        'openid', 'email', 'profile',
        'https://www.googleapis.com/auth/gmail.readonly',
    ];
    private API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me/messages';

    async getMailListing(token: IAuthToken, emailsBefore?: { date: Date, id: string }, nextToken?: string): Promise<MailMessage[]> {
        const validToken = await this.getValidToken(token);
        const params = new URLSearchParams();
        params.set('maxResults', '50');
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
            return [];
        }

        const messageIds = data.messages.map(m => m.id);
        return await this.fetchMessages(validToken, messageIds);
    }

    async fetchMessages(token: IAuthToken, messageIds: string[]): Promise<MailMessage[]> {
        const validToken = await this.getValidToken(token);
        const messages: MailMessage[] = [];

        // fetch messages using batch api with multipart/mixed
        const batchSize = 50;
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

        return {
            id: data.id,
            subject: getHeader('Subject'),
            from: getHeader('From'),
            to: getHeader('To').split(',').map(s => s.trim()),
            cc: getHeader('Cc').split(',').map(s => s.trim()),
            date: new Date(getHeader('Date')),
            snippet: data.snippet,
            body: parseBody(data.payload),
            attachments: [], // Attachments parsing can be implemented as needed
        };
    }
}
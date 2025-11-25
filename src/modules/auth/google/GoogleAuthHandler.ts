/// <reference types="google.accounts" />

import type { AuthHandler, AuthType, Token, UserDetails } from "../types";
import { Utils } from "../Utils";

type TokenClient = google.accounts.oauth2.TokenClient;
type TokenResponse = google.accounts.oauth2.TokenResponse;

export type GoogleAuthConfig = {
    type: 'google';
    clientId: string;
    scopes: string[];
}

export class GoogleAuthHandler implements AuthHandler {
    type: AuthType = 'google';
    private config: GoogleAuthConfig;
    private tokenClient: TokenClient | null = null;
    private token: Token | null = null;
    private userInfo: UserDetails | null = null;
    private prompt: 'none' | 'consent' | 'select_account' = 'none';
    private resolve!: (token: Token | null) => void;
    private reject!: (error: TokenResponse) => void;

    constructor(config: GoogleAuthConfig) {
        this.config = config;
    }

    async restore(token: Token): Promise<boolean> {
        if (token.expiry.getTime() < new Date().getTime()) {
            return this.getToken().then(t => t !== null);
        }
        this.token = token;
        const user = await this.getUserDetails();
        return user !== null;
    }

    async login(): Promise<void> {
        return this.getToken().then();
    }

    async logout(): Promise<void> {
        this.token = null;
        this.userInfo = null;
    }

    async getUserDetails(): Promise<UserDetails | null> {

        if (this.userInfo) return this.userInfo;

        const token = await this.getToken();
        if (!token) return null;

        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
                'Authorization': `Bearer ${token.token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user info');
        }
        const data = await response.json();
        this.userInfo = {
            id: data.sub,
            type: this.type,
            name: data.name,
            email: data.email,
            picture: data.picture,
        };
        return this.userInfo;
    }

    async getToken(): Promise<Token | null> {
        if (this.token && this.token.expiry.getTime() > new Date().getTime()) return this.token;
        const promise = new Promise<Token | null>((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
        const tokenClient = await this.getTokenClient();
        tokenClient.requestAccessToken();
        return promise;
    }

    private async tokenCallbackHandler(response: TokenResponse) {
        if (response.error) {
            if (response.error === 'interaction_required') {
                this.prompt = 'consent';
                this.tokenClient = null;
                const tokenClient = await this.getTokenClient();
                tokenClient.requestAccessToken();
            }
            this.reject(response);
        } else {
            if (!response.access_token || !response.expires_in) this.reject(response);
            this.token = {
                type: this.type,
                token: response.access_token,
                expiry: new Date(Date.now() + (parseInt(response.expires_in) * 1000)),
            };
            this.resolve(this.token);
        }
    }

    private async getTokenClient(): Promise<TokenClient> {
        if (!this.tokenClient) {
            await Utils.loadScript('https://accounts.google.com/gsi/client');
            this.tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: this.config.clientId,
                scope: this.config.scopes.join(' '),
                prompt: this.prompt,
                callback: this.tokenCallbackHandler.bind(this),
            });
        }
        return this.tokenClient;
    }

}
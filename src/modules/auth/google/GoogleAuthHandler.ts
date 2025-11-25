import type { BaseAuthConfig } from "../AuthProvider";
import type { AuthHandler, AuthType, StateData, Token, UserDetails } from "../types";
import { Utils } from "../Utils";

export type GoogleAuthConfig = BaseAuthConfig & {
    type: 'google';
    clientId: string;
    scopes: string[];
}

interface GoogleToken extends Token {
    refreshToken?: string;
}

interface GoogleStateData extends StateData {
    scopes: string[];
    codeVerifier: string;
}

type TokenResponse = {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    scope: string;
    token_type: string;
}

type UserResponse = {
    sub: string;
    name: string;
    email: string;
    picture: string;
}

export class GoogleAuthHandler implements AuthHandler<GoogleToken, GoogleStateData> {
    type: AuthType = "google";
    private config: GoogleAuthConfig;
    private token: GoogleToken | null = null;

    constructor(config: GoogleAuthConfig) {
        this.config = config;
    }

    async restore(token: GoogleToken): Promise<boolean> {
        if (token.expiry.getTime() > new Date().getTime()) {
            this.token = token;
            return true;
        }
        const refreshedToken = await this.refreshToken(token);
        if (!refreshedToken) return false;
        this.token = refreshedToken;
        return true;
    }

    async loginUrl(state: string): Promise<[string, GoogleStateData?]> {
        if (!this.config.callbackUrl) return Promise.resolve(['', undefined]);
        const codeVerifier = this.generateCodeVerifier();
        const codeChallenge = await this.generateCodeChallenge(codeVerifier);
        const stateData: GoogleStateData = {
            type: this.type,
            scopes: this.config.scopes,
            state, codeVerifier
        };
        const params = new URLSearchParams({
            client_id: this.config.clientId,
            response_type: 'code',
            redirect_uri: this.processCallbackUrl(this.config.callbackUrl),
            state: state,
            scope: this.config.scopes.join(' '),
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
        });
        const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
        return [url, stateData];
    }

    async callback(params: Record<string, string>, stateData?: GoogleStateData): Promise<GoogleToken | null> {
        if (!stateData) return Promise.resolve(null);

        const code = params['code'];
        if (!code) return Promise.resolve(null);

        this.token = await this.fetchToken(code, stateData.codeVerifier);
        return this.token;
    }

    async logout(): Promise<void> {
        if (!this.token) return Promise.resolve();
        await this.revokeToken(this.token);
        this.token = null;
        return Promise.resolve();
    }

    getToken(): Promise<GoogleToken | null> {
        return Promise.resolve(this.token);
    }

    getUserDetails(): Promise<UserDetails | null> {
        return this.fetchUserInfo();
    }

    private async fetchToken(code: string, codeVerifier: string): Promise<GoogleToken | null> {
        if (!this.config.callbackUrl) return null;
        const params = new URLSearchParams({
            client_id: this.config.clientId,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: this.processCallbackUrl(this.config.callbackUrl),
            code_verifier: codeVerifier,
        });

        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
        });

        const responseBody = await response.json() as TokenResponse;
        if (!response.ok) {
            console.error('Failed to fetch token:', responseBody);
            return null;
        }

        return {
            type: 'google',
            token: responseBody.access_token,
            expiry: new Date(Date.now() + responseBody.expires_in * 1000),
            refreshToken: responseBody.refresh_token,
        }
    }

    private async refreshToken(token: GoogleToken): Promise<GoogleToken | null> {
        if (!token.refreshToken) return null;
        const params = new URLSearchParams({
            client_id: this.config.clientId,
            grant_type: 'refresh_token',
            refresh_token: token.refreshToken,
        });

        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
        });

        const responseBody = await response.json() as TokenResponse;
        if (!response.ok) {
            console.error('Failed to refresh token:', responseBody);
            return null;
        }

        return {
            type: 'google',
            token: responseBody.access_token,
            expiry: new Date(Date.now() + responseBody.expires_in * 1000),
            refreshToken: token.refreshToken,
        };
    }

    private async revokeToken(token: GoogleToken): Promise<boolean> {
        if (!token.refreshToken) return true;
        const params = new URLSearchParams({
            token: token.refreshToken,
        });
        const response = await fetch('https://oauth2.googleapis.com/revoke', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
        });

        return response.ok;
    }

    private async fetchUserInfo(): Promise<UserDetails | null> {
        if (!this.token) return null;

        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
                'Authorization': `Bearer ${this.token.token}`
            }
        });

        const responseBody = await response.json() as UserResponse;
        if (!response.ok) {
            console.error('Failed to fetch user info:', responseBody);
            return null;
        }
        return {
            id: responseBody.sub,
            type: this.type,
            name: responseBody.name,
            email: responseBody.email,
            picture: responseBody.picture,
        };
    }

    private generateCodeVerifier(length = 128): string {
        const array = Utils.getRandomBytes(length);
        return Utils.bytesToString(array)
    }

    private async generateCodeChallenge(codeVerifier: string): Promise<string> {
        return await Utils.hashUsingSHA256(codeVerifier);
    }

    private processCallbackUrl(url: string): string {
        if (!url.startsWith('/')) return url;
        let baseUrl = window.location.origin + window.location.pathname;
        if (!baseUrl.endsWith('/')) {
            baseUrl += '/';
        }
        return baseUrl + url.substring(1);
    }
}
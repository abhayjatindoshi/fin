import { Utils } from "@/modules/auth/Utils";

type Status = 'waitingForScript' | 'scriptLoaded' | 'discoveryDocsLoaded' | 'needLogin' | 'ready';

export class GoogleDriveLogin {
    static instance: GoogleDriveLogin | null = null;
    static getInstance(): GoogleDriveLogin {
        if (!GoogleDriveLogin.instance) {
            GoogleDriveLogin.instance = new GoogleDriveLogin();
        }
        return GoogleDriveLogin.instance;
    }


    private clientId = '8125620125-tkfb5448rfhk389h550ghpljk73ompe6.apps.googleusercontent.com';
    private scope = 'https://www.googleapis.com/auth/drive.file'
    private discoveryDocs = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
    private localStorageKey = 'drive_local_key';
    private prompt: "" | "none" | "consent" | "select_account" = 'none';
    status: Status = 'waitingForScript';

    getToken = () => window.gapi.client.getToken()?.access_token || null;

    private constructor() {
        Utils.loadScript('https://apis.google.com/js/api.js');
    }

    async op(): Promise<void> {
        switch (this.status) {
            case 'waitingForScript':
                await this.waitForScriptLoad();
                break;
            case 'scriptLoaded':
                await this.loadDiscoveryDocs();
                break;
            case 'discoveryDocsLoaded':
                await this.checkLocalToken();
                break;
            case 'needLogin':
                await this.login();
                break;
            case 'ready':
                // All set
                break;
        }
    }

    private async login(): Promise<void> {
        return new Promise((resolve, reject) => {
            const tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: this.clientId,
                scope: this.scope,
                // prompt: this.prompt,
                callback: async (resp) => {
                    if (resp.error) {
                        if (resp.error === "interaction_required") {
                            this.prompt = 'consent';
                            resolve();
                            return;
                        } else {
                            reject(resp.error);
                        }
                    } else {
                        localStorage.setItem(this.localStorageKey, resp.access_token);
                        window.gapi.client.setToken({ access_token: resp.access_token });
                        this.status = 'ready';
                        resolve();
                    }
                }
            });
            tokenClient.requestAccessToken();
        });
    }

    private async waitForScriptLoad(): Promise<void> {
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                if (window.google && window.gapi) {
                    clearInterval(interval);
                    this.status = 'scriptLoaded';
                    resolve();
                    return;
                }
            }, 100);
        });
    }

    private async loadDiscoveryDocs(): Promise<void> {
        await new Promise((resolve) => {
            window.gapi.load('client', async () => {
                await window.gapi.client.init({
                    clientId: this.clientId,
                    discoveryDocs: this.discoveryDocs,
                });
                this.status = 'discoveryDocsLoaded';
                resolve(true);
            });
        });
    }

    private async checkLocalToken(): Promise<boolean> {
        const token = localStorage.getItem(this.localStorageKey);
        if (!token) {
            this.status = 'needLogin';
            return false;
        }
        let valid = false;

        try {
            await this.testToken(token);
            valid = true;
        } catch (e) {
            console.error('Token is invalid:', e);
            valid = false;
        }

        if (valid) {
            window.gapi.client.setToken({ access_token: token });
            this.status = 'ready';
            return true;
        } else {
            localStorage.removeItem(this.localStorageKey);
            window.gapi.client.setToken(null);
            this.status = 'needLogin';
            return false;
        }
    }

    private async testToken(token: string): Promise<boolean> {
        window.gapi.client.setToken({ access_token: token });
        const result = await window.gapi.client.drive.about.get({
            fields: 'kind,user,storageQuota',
        });
        if (result.status === 200) {
            console.log('Token is valid:', result.result);
            return true;
        } else {
            window.gapi.client.setToken(null);
            return false;
        }
    }
}
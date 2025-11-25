export class Utils {
    static loadScript(src: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
            document.head.appendChild(script);
        });
    }

    private static chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';

    static getRandomBytes(length = 128): Uint8Array {
        const bytes = new Uint8Array(length);
        crypto.getRandomValues(bytes);
        return bytes;
    }

    static bytesToString(bytes: Uint8Array): string {
        return Array.from(bytes)
            .map(byte => Utils.chars[byte % Utils.chars.length])
            .join('');
    }

    static async hashUsingSHA256(data: string): Promise<string> {
        const encoder = new TextEncoder();
        const dataBytes = encoder.encode(data);
        const hash = await crypto.subtle.digest('SHA-256', dataBytes);
        return btoa(String.fromCharCode(...new Uint8Array(hash)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }
}
export function parseJson<T>(json: string): T {
    return JSON.parse(json, dateReviver);
}

export function stringifyJson<T>(value: T): string {
    return JSON.stringify(value);
}

export function sortKeys<T>(obj: Record<string, T>): Record<string, T> {
    return Object.keys(obj).sort()
        .reduce((sorted, key) => {
            sorted[key] = obj[key];
            return sorted;
        }, {} as Record<string, T>);
}

export function generateHash(str: string, seed: number = 0): number {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dateReviver(_key: string, value: any): any {
    if (typeof value === "string") {
        // Check for ISO date format
        const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
        if (isoDateRegex.test(value)) {
            return new Date(value);
        }
    }
    return value;
}
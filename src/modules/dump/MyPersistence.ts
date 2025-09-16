/* eslint-disable @typescript-eslint/no-explicit-any */
import type { EntityKeyData } from "../store/interfaces/EntityKeyData";
import type { IPersistence } from "../store/interfaces/IPersistence";

export class MyPersistence implements IPersistence {
    private store: Map<string, EntityKeyData> = new Map();
    private name: string;

    constructor(name: string) {
        this.name = name;
        this.loadFromLocalStorage();
    }

    private dateReviver(_key: string, value: any): any {
        if (typeof value === "string") {
            // Check for ISO date format
            const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
            if (isoDateRegex.test(value)) {
                return new Date(value);
            }
        }
        return value;
    }

    private loadFromLocalStorage() {
        const raw = localStorage.getItem(this.name);
        if (raw) {
            try {
                const obj = JSON.parse(raw, this.dateReviver);
                this.store = new Map(Object.entries(obj));
            } catch {
                this.store = new Map();
            }
        }
    }

    private saveToLocalStorage() {
        const obj: Record<string, EntityKeyData> = {};
        for (const [key, value] of this.store.entries()) {
            obj[key] = value;
        }
        localStorage.setItem(this.name, JSON.stringify(obj));
    }

    async loadData(key: string): Promise<EntityKeyData | null> {
        return this.store.get(key) || null;
    }

    async storeData(key: string, data: EntityKeyData): Promise<void> {
        this.store.set(key, data);
        this.saveToLocalStorage();
    }

    async clearData(key: string): Promise<void> {
        this.store.delete(key);
        this.saveToLocalStorage();
    }
}

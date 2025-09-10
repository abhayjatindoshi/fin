import type { EntityKey } from "./Entity";

export interface IPersistence {
    load(key: EntityKey): Promise<string | null>;
    save(key: EntityKey, data: string): Promise<void>;
    clear(key: EntityKey): Promise<void>;
}
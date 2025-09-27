import { parseJson, stringifyJson } from "@/modules/common/json";
import type { EntityKeyData } from "@/modules/store/interfaces/EntityKeyData";
import type { IPersistence } from "@/modules/store/interfaces/IPersistence";

export class LocalPersistence implements IPersistence {

    loadData(key: string): Promise<EntityKeyData | null> {
        const data = localStorage.getItem(key);
        return Promise.resolve(data ? parseJson(data) : null);
    }

    storeData(key: string, data: EntityKeyData): Promise<void> {
        localStorage.setItem(key, stringifyJson(data));
        return Promise.resolve();
    }

    clearData(key: string): Promise<void> {
        localStorage.removeItem(key);
        return Promise.resolve();
    }

}
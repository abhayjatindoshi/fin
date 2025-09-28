import { Utils } from "@/modules/common/Utils";
import type { IPersistence } from "@/modules/data-sync/interfaces/IPersistence";
import type { EntityKeyData } from "@/modules/data-sync/interfaces/types";

export class LocalPersistence implements IPersistence {

    loadData(key: string): Promise<EntityKeyData | null> {
        const data = localStorage.getItem(key);
        return Promise.resolve(data ? Utils.parseJson(data) : null);
    }

    storeData(key: string, data: EntityKeyData): Promise<void> {
        localStorage.setItem(key, Utils.stringifyJson(data));
        return Promise.resolve();
    }

    clearData(key: string): Promise<void> {
        localStorage.removeItem(key);
        return Promise.resolve();
    }

}
import { Utils } from "@/modules/common/Utils";
import { type Tenant } from "@/modules/data-sync/entities/Tenant";
import type { IPersistence } from "@/modules/data-sync/interfaces/IPersistence";
import type { EntityKeyData } from "@/modules/data-sync/interfaces/types";

export class LocalPersistence implements IPersistence<Tenant> {

    loadData(tenant: Tenant | null, key: string): Promise<EntityKeyData | null> {
        const entityKey = `${tenant?.id}/${key}`;
        const data = localStorage.getItem(entityKey);
        return Promise.resolve(data ? Utils.parseJson(data) : null);
    }

    storeData(tenant: Tenant | null, key: string, data: EntityKeyData): Promise<void> {
        const entityKey = `${tenant?.id}/${key}`;
        localStorage.setItem(entityKey, Utils.stringifyJson(data));
        return Promise.resolve();
    }

    clearData(tenant: Tenant | null, key: string): Promise<void> {
        const entityKey = `${tenant?.id}/${key}`;
        localStorage.removeItem(entityKey);
        return Promise.resolve();
    }

}
import * as z from "zod";
import { DataOrchestrator } from "../DataOrchestrator";

export function zodReference(entityName: string) {
    return z.string().brand(entityName + "Ref")
        .refine(id => {
            const ctx = DataOrchestrator.getInstance().ctx;
            const entityKey = ctx.entityKeyHandler.getEntityKeyFromId(id);
            if (!entityKey) return false;
            const existingEntity = ctx.store.get(ctx.tenant, entityKey, entityName, id);
            return existingEntity !== null;
        })
}  
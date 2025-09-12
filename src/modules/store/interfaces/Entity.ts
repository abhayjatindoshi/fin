import type { Metadata } from "../entities/Metadata";
import type { UserAccount } from "../entities/UserAccount";

export interface Entity {
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

type EntityNames = {
    UserAccount: UserAccount;
    Metadata: Metadata;
}

export type EntityName = keyof EntityNames;
export type EntityType<K extends EntityName> = EntityNames[K];
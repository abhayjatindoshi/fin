import { createEntityNames, type EntityConfigMap } from "./types";
import type { MoneyAccount } from "./MoneyAccount";
import type { SubTag } from "./SubTag";
import type { Tag } from "./Tag";
import type { Transaction } from "./Transaction";
import type { UserAccount } from "./UserAccount";

export type EntityTypeMap = {
    MoneyAccounts: MoneyAccount;
    SubTag: SubTag;
    Tag: Tag;
    Transaction: Transaction;
    UserAccounts: UserAccount;
};

export const EntityName = createEntityNames<EntityTypeMap>();

export const EntityConfig: EntityConfigMap<EntityTypeMap> = {
    MoneyAccounts: { scope: 'global' },
    SubTag: { scope: 'global' },
    Tag: { scope: 'global' },
    Transaction: {
        scope: 'monthly',
        getKeyDate: (entity: Transaction) => entity.transactionAt
    },
    UserAccounts: { scope: 'global' },
} as const;
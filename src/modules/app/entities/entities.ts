import { EU } from "@/modules/data-sync/EntityUtil";
import { AdapterDataSchema } from "./AdapterData";
import { HouseholdSchema } from "./Household";
import { MoneyAccountSchema } from "./MoneyAccount";
import { SubtagSchema } from "./Subtag";
import { TagSchema } from "./Tag";
import { TransactionSchema, type Transaction } from "./Transaction";
import { type EntityConfigMap } from "./types";
import { UserAccountSchema } from "./UserAccount";

export const util = EU
    .register("Tenant", HouseholdSchema)
    .register("MoneyAccount", MoneyAccountSchema)
    .register("Subtag", SubtagSchema)
    .register("Tag", TagSchema)
    .register("Transaction", TransactionSchema)
    .register("UserAccount", UserAccountSchema)
    .register("AdapterData", AdapterDataSchema)
    ;

export const EntityName = util.entityNames();

export const EntityConfig: EntityConfigMap<typeof util> = {
    // Core system entities
    Tenant: { scope: 'global' },
    Metadata: { scope: 'global' },
    MoneyAccount: { scope: 'global' },
    Subtag: { scope: 'global' },
    Tag: { scope: 'global' },
    Transaction: {
        scope: 'monthly',
        getKeyDate: (entity: Transaction) => entity.transactionAt
    },
    UserAccount: { scope: 'global' },
    AdapterData: { scope: 'global' },
};
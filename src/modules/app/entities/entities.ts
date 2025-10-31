import { EU } from "@/modules/data-sync/EntityUtil";
import { AdapterDataSchema } from "./AdapterData";
import { HouseholdSchema } from "./Household";
import { MoneyAccountSchema } from "./MoneyAccount";
import { SubTagSchema } from "./SubTag";
import { TagSchema } from "./Tag";
import { TransactionSchema, type Transaction } from "./Transaction";
import { type EntityConfigMap } from "./types";
import { UserAccountSchema } from "./UserAccount";

export const util = EU
    .register("Tenant", HouseholdSchema)
    .register("MoneyAccount", MoneyAccountSchema)
    .register("SubTag", SubTagSchema)
    .register("Tag", TagSchema)
    .register("Transaction", TransactionSchema)
    .register("UserAccount", UserAccountSchema)
    .register("AdapterData", AdapterDataSchema)
    ;

export const EntityName = util.entityNames();

export const EntityConfig: EntityConfigMap<typeof util> = {
    MoneyAccount: { scope: 'global' },
    SubTag: { scope: 'global' },
    Tag: { scope: 'global' },
    Transaction: {
        scope: 'monthly',
        getKeyDate: (entity: Transaction) => entity.transactionAt
    },
    UserAccount: { scope: 'global' },
    AdapterData: { scope: 'global' },
};
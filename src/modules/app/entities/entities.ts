import { EU } from "@/modules/data-sync/EntityUtil";
import { AuthAccountSchema } from "./AuthAccount";
import { BudgetLineSchema, type BudgetLine } from "./BudgetLine";
import { EmailImportSettingSchema } from "./EmailImportSetting";
import { HouseholdSchema } from "./Household";
import { MoneyAccountSchema } from "./MoneyAccount";
import { SettingSchema } from "./Setting";
import { TagSchema } from "./Tag";
import { TransactionSchema, type Transaction } from "./Transaction";
import { type EntityConfigMap } from "./types";

export const util = EU
    .register("AuthAccount", AuthAccountSchema)
    .register("BudgetLine", BudgetLineSchema)
    .register("EmailImportSetting", EmailImportSettingSchema)
    .register("MoneyAccount", MoneyAccountSchema)
    .register("Setting", SettingSchema)
    .register("Tag", TagSchema)
    .register("Tenant", HouseholdSchema)
    .register("Transaction", TransactionSchema)
    ;

export const EntityName = util.entityNames();

export const EntityConfig: EntityConfigMap<typeof util> = {
    AuthAccount: { scope: 'global' },
    BudgetLine: {
        scope: 'yearly',
        getKeyDate: (entity: BudgetLine) => entity.year,
    },
    EmailImportSetting: { scope: 'global' },
    Metadata: { scope: 'global' },
    MoneyAccount: { scope: 'global' },
    Setting: { scope: 'global' },
    Tag: { scope: 'global' },
    Tenant: { scope: 'global' },
    Transaction: {
        scope: 'monthly',
        getKeyDate: (entity: Transaction) => entity.transactionAt,
    },
};
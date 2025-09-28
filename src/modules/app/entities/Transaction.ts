import type { Entity } from "@/modules/data-sync/interfaces/Entity";

export interface Transaction extends Entity {
    accountId: string;
    tagId: string;
    subTagId?: string;
    transferAccountId?: string;
    merchantId?: string;
    title: string;
    narration: string;
    transactionAt: Date;
    amount: number;
    hash: number;
}
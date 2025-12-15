import type { BudgetLine } from "../entities/BudgetLine";
import { EntityName } from "../entities/entities";
import type { Transaction } from "../entities/Transaction";
import { BaseService } from "./BaseService";
import type { EnhancedTag } from "./TaggingService";
import { TransactionService } from "./TransactionService";

export type BudgetBlock = {
    tag: EnhancedTag;
    budgetLine?: BudgetLine;
    transactions: Transaction[];
    totalReceived: number;
    totalGiven: number;
    children: BudgetBlock[];
}

export const UNTAGGED_TAG: EnhancedTag = {
    id: undefined,
    name: 'Untagged',
    icon: 'tag',
    createdAt: new Date(0),
    updatedAt: new Date(0),
    version: 1,
    searchWords: [],
    children: []
}

export class BudgetService extends BaseService {
    async getBudgetForYear(year: number, tagMap: Record<string, EnhancedTag>): Promise<BudgetBlock[]> {
        const allTransactions = await new TransactionService().getTransactionsForYear(year);
        const budgetLines = await this.repository(EntityName.BudgetLine).getAll({ years: [year] }) as BudgetLine[];
        const parentTags = [UNTAGGED_TAG, ...Object.values(tagMap).filter(tag => tag.parent === undefined)];
        return parentTags.map(parentTag => this.buildBudgetBlock(parentTag, allTransactions, budgetLines, tagMap));
    }

    private buildBudgetBlock(tag: EnhancedTag, allTransactions: Transaction[], budgetLines: BudgetLine[], tagMap: Record<string, EnhancedTag>): BudgetBlock {
        const children = tag.children.map(childTag => this.buildBudgetBlock(childTag, allTransactions, budgetLines, tagMap));
        const budgetLine = budgetLines.find(bl => bl.tagId === tag.id);
        const transactions = [
            ...allTransactions.filter(t => t.tagId === tag.id),
            ...children.flatMap(c => c.transactions)
        ];
        const totalReceived = transactions.reduce((sum, t) => t.amount > 0 ? sum + t.amount : sum, 0);
        const totalGiven = transactions.reduce((sum, t) => t.amount < 0 ? sum + t.amount : sum, 0);
        return { tag, budgetLine, transactions, totalReceived, totalGiven, children };
    }
}
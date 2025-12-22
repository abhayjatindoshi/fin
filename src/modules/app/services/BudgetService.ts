import type { BudgetLine } from "../entities/BudgetLine";
import { EntityName } from "../entities/entities";
import type { Transaction } from "../entities/Transaction";
import { BaseService } from "./BaseService";
import { SettingService } from "./SettingService";
import type { EnhancedTag } from "./TaggingService";
import { TransactionService } from "./TransactionService";

export type BudgetBlock = {
    tag: EnhancedTag;
    budgetLine?: BudgetLine;
    transactions: Transaction[];
    totalReceived: number;
    totalGiven: number;
    totalSum: number;
    chartPoints: { date: Date; amount: number }[];
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

        const firstMonth = await new SettingService().get("calendar.firstMonth").then(val => parseInt(val)).catch(() => 0);

        const parentTags = [UNTAGGED_TAG, ...Object.values(tagMap).filter(tag => tag.parent === undefined)];
        return parentTags.map(parentTag => this.buildBudgetBlock(parentTag, allTransactions, budgetLines, tagMap, firstMonth, year));
    }

    async saveBudgetLine(budgetLine: BudgetLine): Promise<void> {
        const repo = this.repository(EntityName.BudgetLine);
        const existingLines = await repo.getAll({
            years: [budgetLine.year.getFullYear()],
            where: { tagId: budgetLine.tagId }
        }) as BudgetLine[];

        if (existingLines.length > 0) {
            existingLines[0].monthlyLimit = budgetLine.monthlyLimit;
            existingLines[0].yearlyLimit = budgetLine.yearlyLimit;
            repo.save(existingLines[0])

            for (let i = 1; i < existingLines.length; i++) {
                repo.delete(existingLines[i].id!);
            }
        } else {
            budgetLine.year = new Date(budgetLine.year.getFullYear(), 0, 1);
            repo.save(budgetLine);
        }
    }

    async deleteBudgetLine(year: number, tagId: string): Promise<void> {
        const repo = this.repository(EntityName.BudgetLine);
        const existingLine = await repo.getAll({
            years: [year],
            where: { tagId }
        }) as BudgetLine[];
        for (const line of existingLine) {
            repo.delete(line.id!);
        }
    }

    private buildBudgetBlock(tag: EnhancedTag, allTransactions: Transaction[], budgetLines: BudgetLine[], tagMap: Record<string, EnhancedTag>, firstMonth: number, year: number): BudgetBlock {
        const children = tag.children.map(childTag => this.buildBudgetBlock(childTag, allTransactions, budgetLines, tagMap, firstMonth, year));
        const budgetLine = budgetLines.find(bl => bl.tagId === tag.id);
        const transactions = allTransactions.filter(t => t.tagId === tag.id);
        transactions.push(...children.flatMap(c => c.transactions));
        const chartPoints = this.makeChartPoints(transactions, firstMonth, year);
        const totalReceived = transactions.reduce((sum, t) => t.amount > 0 ? sum + t.amount : sum, 0);
        const totalGiven = transactions.reduce((sum, t) => t.amount < 0 ? sum + t.amount : sum, 0);
        const totalSum = totalReceived + totalGiven;
        return { tag, budgetLine, transactions, totalReceived, totalGiven, totalSum, chartPoints, children };
    }

    private makeChartPoints(transactions: Transaction[], firstMonth: number, year: number) {
        const chartPoints = [];
        for (let i = 0; i < 12; i++) {
            const month = (firstMonth + i) % 12;
            const monthYear = month < firstMonth ? year + 1 : year;
            const monthTransactions = transactions.filter(t => t.transactionAt.getMonth() === month && t.transactionAt.getFullYear() === monthYear);
            const monthSum = monthTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
            const date = new Date(monthYear, month, 1);
            chartPoints.push({ date, amount: Math.abs(monthSum), transactions: monthTransactions });
        }
        return chartPoints;
    }
}
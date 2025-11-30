import type { QueryOptions } from "@/modules/data-sync/interfaces/QueryOptions";
import type { EntityNameOf } from "@/modules/data-sync/interfaces/types";
import type { DateStrategyOptions } from "@/modules/data-sync/strategies/EntityKeyDateStrategy";
import { stringSimilarity } from 'string-similarity-js';
import type { Transaction } from "../entities/Transaction";
import { EntityName, type util } from "../entities/entities";
import { BaseService } from "./BaseService";

type SearchIndex = {
    upiIds: string[];
    skippedWords: string[];
    fullNarration: string;
    leftOverLine: string;
}

export class TransactionService extends BaseService {

    async getSimilarTransactions<U extends typeof util, N extends EntityNameOf<U>>(transaction: Transaction, filter?: QueryOptions<typeof util, N> & DateStrategyOptions): Promise<Transaction[]> {
        const sourceSearchIndex = this.createSearchIndex(transaction);
        const repo = this.repository(EntityName.Transaction);
        const transactions = await repo.getAll(filter) as Transaction[];
        const searchIndices = transactions.map(this.createSearchIndex.bind(this));
        const similarity = searchIndices.map(t => this.getSimilarityScore(sourceSearchIndex, t));
        return transactions.filter((_, i) => similarity[i] > 0.8);
    }

    private upiRegex = /([a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64})/g;
    private skipWords = [
        /[0-9]{6,12}/g, // generic numbers
        /upi|pay|paytm|phonepe|google|googlepay|bhim|amazon|amazonpay/gi, // common words
        /\d{2,4}[/\/-]\d{2}[/\/-]\d{2,4}/g, // dates
    ];

    private createSearchIndex(transaction: Transaction): SearchIndex {
        let line = transaction.narration;

        const upiIds: string[] = [];
        const matches = [...line.matchAll(this.upiRegex)];
        for (const match of matches) {
            if (match[1]) upiIds.push(match[1]);
            line = line.replace(match[1], '');
        }

        const skippedWords: string[] = [];
        for (const regex of this.skipWords) {
            const skipMatches = [...line.matchAll(regex)];
            for (const match of skipMatches) {
                if (match[0]) skippedWords.push(match[0]);
                line = line.replace(match[0], '');
            }
        }

        return { upiIds, skippedWords, fullNarration: transaction.narration.toLowerCase(), leftOverLine: line.toLowerCase() };
    }

    private getSimilarityScore(left: SearchIndex, right: SearchIndex): number {
        if (left.upiIds.some(upi => right.upiIds.includes(upi))) {
            return 1;
        }

        return Math.max(
            stringSimilarity(left.fullNarration, right.fullNarration),
            left.leftOverLine.length > 15 && right.leftOverLine.length > 15 ?
                stringSimilarity(left.leftOverLine, right.leftOverLine) : 0
        );
    }
}
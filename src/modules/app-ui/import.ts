import stringSimilarity from "string-similarity-js";
import { SystemTags } from "../app/common/SystemTags";
import { EntityName, type util } from "../app/entities/entities";
import type { Household } from "../app/entities/Household";
import type { Tag } from "../app/entities/Tag";
import type { Transaction } from "../app/entities/Transaction";
import type { DateStrategy } from "../app/store/DateStrategy";
import { DataOrchestrator } from "../data-sync/DataOrchestrator";
import type { DataRepository } from "../data-sync/DataRepository";
import type { DateStrategyOptions } from "../data-sync/strategies/EntityKeyDateStrategy";

declare global {
    interface Window {
        orchestrator?: DataOrchestrator<typeof util, DateStrategy, Household>;
        import(data: OldTransactionData): Promise<void>;
        tags: Record<string, Tag>;
        tagMap: Record<string, string>;
    }
}

type SearchIndex = {
    upiIds: string[];
    skippedWords: string[];
    fullNarration: string;
    leftOverLine: string;
}

export type OldTransactionData = {
    transactions: OldTransactionPaste[];
}

type OldTransactionPaste = {
    id: string;
    title: string;
    summary: string;
    amount: number;
    transactionAt: Date;
    accountName: string;
    subCategoryName: string | null;
    transferAccountName: string | null;
    categoryName: string | null;
    createdAt: Date;
    modifiedAt: Date | null;
}

type OldTransaction = {
    id: string;
    title: string;
    summary: string;
    amount: number;
    transactionAt: Date;
    accountName: string;
    subCategoryName: string | null;
    transferAccountName: string | null;
    categoryName: string | null;
    createdAt: Date;
    modifiedAt: Date | null;
}

type SearchTransaction = Transaction & {
    idx?: SearchIndex;
    score?: number;
}

export const setupWindow = () => {
    window.import = importDataFromOldApp;
    window.tags = SystemTags;
}

const tagMap: Record<string, string> = {
    "Appliances": "system-tag-shopping-appliances",
    "Auto": "system-tag-commute-auto",
    "Bank Interest": "system-tag-income-interest",
    "Breakfast": "system-tag-diningout-breakfast",
    "Cab": "system-tag-commute-cab",
    "Cashback": "system-tag-cashback",
    "Chips": "system-tag-groceries-chips",
    "Commute": "system-tag-commute",
    "Delivery": "system-tag-eatingin-delivery",
    "Electricity": "system-tag-bills-electricity",
    "Food": "system-tag-trips-meals",
    "Gas": "system-tag-bills-gas",
    "Gifts": "system-tag-gift",
    "Income Tax": "system-tag-tax-incometax",
    "Internet": "system-tag-bills-internet",
    "Jigna HDFC": "system-tag-support-mom",
    "Junk": "system-tag-groceries-chips",
    "Liesure": "system-tag-entertainment-leisure",
    "Maintenance": "system-tag-house-maintenance",
    "Medicine": "system-tag-medical-medicines",
    "Metro": "system-tag-commute-metro",
    "Mobile": "system-tag-shopping-electronics",
    "Movies": "system-tag-entertainment-movies",
    "Pani Puri": "system-tag-diningout-streetfood",
    "Papa": "system-tag-support-dad",
    "Parlour": "system-tag-personal-parlour",
    "Petrol": "system-tag-commute-fuel",
    "PPF": "system-tag-investments-ppf",
    "Property Tax": "system-tag-tax-propertytax",
    "Rent": "system-tag-house-rent",
    "Restaurant": "system-tag-diningout-restaurant",
    "Salary": "system-tag-income-salary",
    "SBI Loan": "system-tag-emi-house",
    "Shopping": "system-tag-shopping",
    "Stocks": "system-tag-investments-stocks",
    "Supermarket": "system-tag-groceries-supermarket",
    "Tailor": "system-tag-services-tailor",
    "Train": "system-tag-travel-train",
    "Water Can": "system-tag-bills-water",
    "Water Tax": "system-tag-tax-watertax",
    "Ice cream & Juice": "system-tag-diningout-juice",
    "Bank Charges": "system-tag-bankcharges",
    "Eshita Jupiter A/C": "account-jupiter-upi-account-6111",
    "Abhay Jupiter A/C": "account-jupiter-upi-account-0237",
    "Abhay HDFC A/C": "account-hdfc-savings-account-4560",
    "Federal Bank Wave CC": "account-federal-credit-card-3505",
    "Federal Bank Celesta CC": "account-federal-credit-card-1162",
    "Rajasthan Trip": "custom-Rajasthan Trip",
    "Dining": "system-tag-diningout-restaurant",
    "Grocery": "system-tag-groceries",
    "Home Appliances": "system-tag-shopping-appliances",
    "Train Tickets": "system-tag-travel-train",
    "Charity": "system-tag-donation",
    "Sharekhan": "system-tag-investments-stocks",
    "House Rent": "system-tag-house-rent",
    "Movie": "system-tag-entertainment-movies",
    "Gift": "system-tag-gift",
    "Microsoft": "system-tag-income-salary",
    "Abhay HDFC PPF A/C": "system-tag-investments-ppf",
    "Outing": "system-tag-entertainment-leisure",
    "SBI Home Loan": "system-tag-emi-house",
    "Packers and Movers": "system-tag-logistics-packersmovers",
    "Mobile Recharge": "system-tag-bills-mobile",
    "Home Maintenance": "system-tag-house-maintenance",
    "Bhutan Trip": "custom-Bhutan Trip",
    "Medical": "system-tag-medical-medicines",
    "Gold": "system-tag-investments-gold",
    "LIC": "system-tag-investments-ulip",
    "Gujarat Trip": "custom-Gujarat Trip",
    "Max Life": "system-tag-insurance-life",
    "Friends": "system-tag-entertainment-friends",
    "Shubh": "custom-Shubh",
    "Vini": "custom-Vini",
    "Vini HDFC A/C": "custom-Vini",
    "Shubh Spends": "custom-Shubh",
    "Milind Spends": "custom-Milind",
    "Raj Spends": "custom-Raj",
    "Devesh Marriage": "custom-Devesh Marriage",
    "Bachelorette Anjali": "custom-Anjali Bachelorette",
    "Shah Family": "custom-Shah Family",
    "Anjali Spends": "custom-Anjali",
    "Shah Family Spends": "custom-Shah Family",
    "Abhay Spends": "system-tag-entertainment-friends",
    "Eshita Spends": "system-tag-shopping",
    "Eshita ICICI A/C": "system-tag-support-spouse",
    "Papa Spends": "system-tag-support-dad",
    "Mummy Spends": "system-tag-support-mom",
    "Kanak Jewellers BOB A/C": "system-tag-support-dad",
    // "Abhay PayTM Bank A/C": "",
};

const customTags: Record<string, Partial<Tag>> = {
    "Anjali Bachelorette": {
        name: "Anjali Bachelorette",
        icon: "party-popper",
        parent: "system-tag-events"
    },
    "Shah Family": {
        name: "Shah Family",
        icon: "users",
        parent: "system-tag-shared"
    },
    "Anjali": {
        name: "Anjali",
        icon: "user",
        parent: "system-tag-shared"
    },
    "Devesh Marriage": {
        name: "Devesh Marriage",
        icon: "gem",
        parent: "system-tag-events"
    },
    "Vini": {
        name: "Vini",
        icon: "user",
        parent: "system-tag-shared"
    },
    "Shubh": {
        name: "Shubh",
        icon: "user",
        parent: "system-tag-shared"
    },
    "Milind": {
        name: "Milind",
        icon: "user",
        parent: "system-tag-shared"
    },
    "Raj": {
        name: "Raj",
        icon: "user",
        parent: "system-tag-shared"
    },
    "Rajasthan Trip": {
        name: "Rajasthan Trip",
        icon: "plane",
        parent: 'system-tag-trips',
    },
    "Bhutan Trip": {
        name: "Bhutan Trip",
        icon: "plane",
        parent: 'system-tag-trips',
    },
    "Gujarat Trip": {
        name: "Gujarat Trip",
        icon: "plane",
        parent: 'system-tag-trips',
    },
}

let store: any[] = [];

export const importDataFromOldApp = async ({ transactions }: OldTransactionData) => {
    transactions = transactions.map(tx => ({
        ...tx,
        transactionAt: new Date(tx.transactionAt),
        createdAt: new Date(tx.createdAt),
        modifiedAt: tx.modifiedAt ? new Date(tx.modifiedAt) : null,
    }));
    console.log("Importing data from old app:", transactions);
    const orchestrator = window.orchestrator;
    if (!orchestrator) {
        console.error("Data orchestrator is not available.");
        return;
    }

    store = [];
    const repo = orchestrator.repo(EntityName.Transaction) as DataRepository<typeof util, typeof EntityName.Transaction, DateStrategyOptions, Household>;
    for (const tx of transactions) {
        const similarTx = await getSimilarTransaction(orchestrator, tx);
        const storeEntry: any = { type: 'updated', source: tx, target: similarTx };
        if (similarTx) {
            if (tx.title !== tx.summary) {
                similarTx.title = tx.title;
                storeEntry.titleUpdated = true;
            }
            let existingTagId = similarTx.tagId;

            if (tx.subCategoryName) {
                const tagId = await getTagIdForName(tx.subCategoryName);
                if (tagId) {
                    similarTx.tagId = tagId;
                    storeEntry.subCategoryTagAssigned = true;
                } else {
                    storeEntry.missingTagReference = true;
                }
            } else if (tx.transferAccountName) {
                const tagId = await getTagIdForName(tx.transferAccountName);
                if (tagId) {
                    similarTx.tagId = tagId;
                    storeEntry.transferAccountTagAssigned = true;
                } else {
                    storeEntry.missingTagReference = true;
                }
            } else {
                storeEntry.noTagAssigned = true;
            }

            if (existingTagId === similarTx.tagId) {
                storeEntry.tagAlreadyAssigned = true;
                delete storeEntry.subCategoryTagAssigned;
                delete storeEntry.transferAccountTagAssigned;
            } else {
                storeEntry.tagUpdated = true;
            }

            repo.save({ ...similarTx });
            store.push(storeEntry);
        }
    }

    console.log("Import completed. Summary:", store.reduce((acc, curr) => {
        acc[curr.type] = (acc[curr.type] || 0) + 1;
        if (curr.type === 'updated') {
            acc['updatedStats'] = acc['updatedStats'] || {};
            if (curr.titleUpdated) {
                acc['updatedStats']['titleUpdated'] = (acc['updatedStats']['titleUpdated'] || 0) + 1;
            }
            if (curr.tagAlreadyAssigned) {
                acc['updatedStats']['tagAlreadyAssigned'] = (acc['updatedStats']['tagAlreadyAssigned'] || 0) + 1;
            }
            if (curr.subCategoryTagAssigned) {
                acc['updatedStats']['subCategoryTagAssigned'] = (acc['updatedStats']['subCategoryTagAssigned'] || 0) + 1;
            }
            if (curr.transferAccountTagAssigned) {
                acc['updatedStats']['transferAccountTagAssigned'] = (acc['updatedStats']['transferAccountTagAssigned'] || 0) + 1;
            }
        }
        return acc;
    }, {} as Record<string, number>));

    console.log("Detailed log:", store.reduce((acc, curr) => {
        const type = curr.type;
        if (!acc[type]) acc[type] = [];
        acc[type].push(curr);
        return acc;
    }, {} as Record<string, any[]>));
}

const getTagIdForName = async (name: string): Promise<string | null> => {
    const tagId = tagMap[name] || null;
    if (tagId && tagId.startsWith('custom-')) {
        const tagName = tagId.replace('custom-', '');
        const orchestrator = window.orchestrator;
        if (!orchestrator) return null;
        const tagRepo = orchestrator.repo(EntityName.Tag) as DataRepository<typeof util, typeof EntityName.Tag, DateStrategyOptions, Household>;
        const existingTags = await tagRepo.getAll() as Tag[];
        const existingTag = existingTags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
        if (existingTag) {
            return existingTag.id || null;
        } else {
            const customTagData = customTags[tagName];
            if (!customTagData) return null;
            return tagRepo.save(customTagData as Tag);
        }
    }
    return tagId;
}

const getSimilarTransaction = async (orchestrator: DataOrchestrator<typeof util, DateStrategy, Household>, transaction: OldTransaction): Promise<Transaction | null> => {
    const transactionRepo = orchestrator.repo(EntityName.Transaction) as DataRepository<typeof util, typeof EntityName.Transaction, DateStrategyOptions, Household>;
    const year = transaction.transactionAt.getFullYear();
    const transactions = await transactionRepo.getAll({ years: [year] }) as SearchTransaction[];
    const filtered = transactions.filter(tx =>
        tx.transactionAt.getDate() === transaction.transactionAt.getDate() &&
        tx.transactionAt.getMonth() === transaction.transactionAt.getMonth() &&
        tx.amount === transaction.amount
    );

    if (filtered.length === 0) {
        store.push({
            type: 'no-match',
            source: transaction,
        });
        return null;
    }
    if (filtered.length === 1) return filtered[0];
    else {
        const sourceIndex = createSearchIndex(transaction.summary);
        filtered.forEach(tx => {
            tx.idx = createSearchIndex(tx.narration);
            tx.score = getSimilarityScore(sourceIndex, tx.idx);
        });
        const sorted = filtered.sort((a, b) => (b.score || 0) - (a.score || 0));
        const bestScore = sorted[0].score || 0;
        const secondBestScore = sorted[1].score || 0;
        const diff = bestScore - secondBestScore;
        if (bestScore > 0.5 && diff >= 0.2) {
            return sorted[0];
        } else {
            store.push({
                type: 'multiple-match',
                source: transaction,
                candidates: sorted.map(tx => ({ transaction: tx, score: tx.score || 0 })),
            });
            return null;
        }
    }

}

const upiRegex = /([a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64})/g;
const skipWords = [
    // /[0-9]{6,12}/g, // generic numbers
    /upi|pay|paytm|phonepe|google|googlepay|bhim|amazon|amazonpay/gi, // common words
    /\d{2,4}[/\/-]\d{2}[/\/-]\d{2,4}/g, // dates
];


const createSearchIndex = (line: string): SearchIndex => {

    const upiIds: string[] = [];
    let matches = [...line.matchAll(upiRegex)];
    if (matches.length === 0) {
        matches = [...line.replaceAll(/\s/g, '').matchAll(upiRegex)];
    }
    for (const match of matches) {
        if (match[1]) upiIds.push(match[1]);
        line = line.replace(match[1], '');
    }

    const skippedWords: string[] = [];
    for (const regex of skipWords) {
        const skipMatches = [...line.matchAll(regex)];
        for (const match of skipMatches) {
            if (match[0]) skippedWords.push(match[0]);
            line = line.replace(match[0], '');
        }
    }

    return { upiIds, skippedWords, fullNarration: line.toLowerCase(), leftOverLine: line.toLowerCase() };
}

const getSimilarityScore = (left: SearchIndex, right: SearchIndex): number => {
    if (left.upiIds.some(upi => right.upiIds.includes(upi))) {
        return 1;
    }

    return Math.max(
        stringSimilarity(left.fullNarration, right.fullNarration),
        left.leftOverLine.length > 15 && right.leftOverLine.length > 15 ?
            stringSimilarity(left.leftOverLine, right.leftOverLine) : 0
    );
}
import { EntityName, util } from "@/modules/app/entities/entities";
import type { Tag } from "@/modules/app/entities/Tag";
import type { Transaction } from "@/modules/app/entities/Transaction";
import { TransactionService } from "@/modules/app/services/TransactionService";
import { Separator } from "@/modules/base-ui/components/ui/separator";
import { useDataSync } from "@/modules/data-sync/providers/DataSyncProvider";
import moment from "moment";
import { useState } from "react";
import { useEntity } from "../../providers/EntityProvider";
import BulkTagPrompt from "./BulkTagPrompt";
import AccountCell from "./cells/AccountCell";
import AmountCell from "./cells/AmountCell";
import DateCell from "./cells/DateCell";
import DescriptionCell from "./cells/DescriptionCell";
import TagCell from "./cells/TagCell";
import { TagPicker } from "./TagPicker";
import type { TransactionRowProps, TransactionTitleProps } from "./TransactionVirtualizer";
import TransactionVirtualizer from "./TransactionVirtualizer";

type TransactionsCardViewProps = {
    transactions: Array<Transaction>;
    forceUpdate: () => void;
}

const TransactionsCardView: React.FC<TransactionsCardViewProps> = ({ transactions, forceUpdate }) => {
    const { orchestrator } = useDataSync();
    const { accountMap } = useEntity();

    const [showTagPicker, setShowTagPicker] = useState<boolean>(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

    const [showBulkTagPrompt, setShowBulkTagPrompt] = useState<boolean>(false);
    const [selectedTransactions, setSelectedTransactions] = useState<Array<Transaction>>([]);
    const [selectedTag, setSelectedTag] = useState<Tag | null>(null);

    const setTag = async (tag: Tag | null) => {
        if (!selectedTransaction || !orchestrator) return;

        setSelectedTag(tag);
        const repo = orchestrator.repo(EntityName.Transaction);
        selectedTransaction.tagId = tag?.id;
        repo.save({ ...selectedTransaction });
        setSelectedTransaction(null);
        setShowTagPicker(false);

        const transactionYear = selectedTransaction.transactionAt.getFullYear();
        const similarTransactions = await new TransactionService()
            .getSimilarTransactions<typeof util, 'Transaction'>(
                selectedTransaction,
                { years: [transactionYear - 1, transactionYear, transactionYear + 1] }
            );

        if (similarTransactions.length > 0) {
            setSelectedTransactions(similarTransactions);
            setShowBulkTagPrompt(true);
        }
    }

    const onBulkTagPromptStateChange = (state: boolean) => {
        setShowBulkTagPrompt(state);
        forceUpdate();
    }

    const openTagPicker = (tx: Transaction) => {
        setSelectedTransaction(tx);
        setShowTagPicker(true);
    }

    const TransactionRow: React.FC<TransactionRowProps> = ({ item, transaction, style }) => {
        return <div key={item.key} data-index={item.index} style={style}>
            <div key={transaction.id} className="flex flex-col rounded-xl border mx-4">
                <div className="flex flex-row items-center justify-between gap-3 px-3 py-1">
                    <div className="flex-1"><DescriptionCell transaction={transaction} className="p-0" /></div>
                    <div className="shrink-0"><DateCell date={transaction.transactionAt} /></div>
                </div>
                <Separator />
                <div className="flex flex-row justify-between gap-3 p-3">
                    <div className="text-3xl"><AmountCell amount={transaction.amount} /></div>
                    <div className="flex flex-row gap-3 items-center">
                        <TagCell tagId={transaction.tagId ?? null} onClick={() => openTagPicker(transaction)} />
                        {accountMap && <AccountCell account={accountMap[transaction.accountId]} />}
                    </div>
                </div>
            </div>
        </div>
    }

    const TransactionTitleRow: React.FC<TransactionTitleProps> = ({ item, title, style, active }) => {
        const styleClasses = `mx-4 px-4 py-1 w-fit font-semibold
            text-muted-foreground rounded-full
            ${active && `bg-secondary/50 backdrop-blur border`}`;

        const positionClasses = `${active && 'fixed top-16'}`;
        return <div key={item.key} data-index={item.index} style={style}>
            <div className={`flex flex-row justify-between w-full ${positionClasses}`}>
                <div className={styleClasses}>
                    {moment(title.date).format('MMMM YYYY')}
                </div>
                <div className={styleClasses}>
                    {title.count} transaction{title.count !== 1 ? 's' : ''}
                </div>
            </div>
        </div>
    }

    return <>
        <TransactionVirtualizer
            transactions={transactions}
            TransactionRow={TransactionRow} transactionRowSize={120}
            TransactionTitleRow={TransactionTitleRow} titleRowSize={40}
        />

        <TagPicker
            variant="sheet"
            open={showTagPicker}
            onOpenChange={setShowTagPicker}
            selectedTagId={selectedTransaction?.tagId}
            setSelectedTag={(tag) => setTag(tag)} />

        {selectedTag && <BulkTagPrompt
            variant="sheet"
            open={showBulkTagPrompt}
            onOpenChange={onBulkTagPromptStateChange}
            TransactionRow={TransactionRow}
            description={`Found ${selectedTransactions.length} similar transactions. Do you want to update tags for them too?`}
            transactions={selectedTransactions}
            tagToApply={selectedTag} />}

    </>;
}

export default TransactionsCardView;
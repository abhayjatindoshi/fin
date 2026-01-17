import { EntityName, util } from "@/modules/app/entities/entities";
import type { Tag } from "@/modules/app/entities/Tag";
import type { Transaction } from "@/modules/app/entities/Transaction";
import { TransactionService } from "@/modules/app/services/TransactionService";
import { useDataSync } from "@/modules/data-sync/providers/DataSyncProvider";
import { ChevronRight } from "lucide-react";
import moment from "moment";
import { useRef, useState } from "react";
import { useEntity } from "../../providers/EntityProvider";
import BulkTagPrompt from "./BulkTagPrompt";
import AccountCell from "./cells/AccountCell";
import AmountCell from "./cells/AmountCell";
import DateCell from "./cells/DateCell";
import DescriptionCell from "./cells/DescriptionCell";
import TagCell from "./cells/TagCell";
import { TagPicker } from "./TagPicker";
import TransactionVirtualizer, { type TransactionRowProps, type TransactionTitleProps } from "./TransactionVirtualizer";

type TransactionsTableViewProps = {
    transactions: Array<Transaction>;
    forceUpdate: () => void;
    detailedTransactionId: string | null;
    setDetailedTransactionId: (id: string | null) => void;
}

const TransactionsTableView: React.FC<TransactionsTableViewProps> = ({ transactions, forceUpdate, detailedTransactionId, setDetailedTransactionId }) => {
    const { orchestrator } = useDataSync();
    const { accountMap } = useEntity();

    const popupAnchorPosition = useRef<DOMRect | undefined>(undefined);

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
        let similarTransactions = await new TransactionService()
            .getSimilarTransactions<typeof util, 'Transaction'>(
                selectedTransaction,
                { years: [transactionYear - 1, transactionYear, transactionYear + 1] }
            );
        similarTransactions = similarTransactions.filter(t => t.tagId !== tag?.id);

        if (similarTransactions.length > 0) {
            setSelectedTransactions(similarTransactions);
            setShowBulkTagPrompt(true);
        }

    }

    const onBulkTagPromptStateChange = (state: boolean) => {
        setShowBulkTagPrompt(state);
        forceUpdate();
    }

    const openTagPicker = (event: React.MouseEvent, tx: Transaction) => {
        event.stopPropagation();
        setSelectedTransaction(tx);
        const rect = event.currentTarget.getBoundingClientRect();
        popupAnchorPosition.current = rect;
        setShowTagPicker(true);
    }

    const TransactionRow: React.FC<TransactionRowProps> = ({ item, transaction, style, first, last }) => {

        const className = `py-2 flex flex-row items-center gap-2 
            hover:bg-muted/50 border
            ${first ? 'rounded-t-lg' : ''} 
            ${last ? 'rounded-b-lg' : ''}
            ${detailedTransactionId === transaction.id && 'bg-secondary/80'}
            `;

        return <div key={item.key} data-index={item.index} style={style}>
            <div key={transaction.id} className={className} onClick={() => setDetailedTransactionId(transaction.id ?? null)}>
                {/* <div className="w-12"><Checkbox className="ml-3" /></div> */}
                <div className="w-24 px-4"><DateCell date={transaction.transactionAt} /></div>
                <div className="w-40 text-xl"><AmountCell amount={transaction.amount} /></div>
                <div className="flex-1 truncate"><DescriptionCell transaction={transaction} /></div>
                <div className="w-48"><TagCell tagId={transaction.tagId ?? null} onClick={(e) => openTagPicker(e, transaction)} /></div>
                <div className="w-36 flex flex-row justify-between items-center" onClick={(e) => e.stopPropagation()}>
                    {accountMap && <AccountCell variant="detailed" account={accountMap[transaction.accountId]} />}
                    {detailedTransactionId === transaction.id && <ChevronRight className="text-muted-foreground mr-4" />}
                </div>
            </div>
        </div>
    }

    const TransactionTitleRow: React.FC<TransactionTitleProps> = ({ item, title, active, style }) => {

        const styleClasses = `my-2 py-1 w-fit font-semibold 
            text-muted-foreground
            ${active && `bg-secondary/50 backdrop-blur-sm rounded-full border px-4`}`;

        const positionClasses = `${active && 'fixed top-25 left-24 mt-4 w-[calc(100vw-12rem-10px)] z-10'}
            ${detailedTransactionId && 'w-[calc(100vw-12rem-10px-25rem)]'}`;

        return <div key={item.key} data-index={item.index} style={style}>
            <div className={`flex flex-row justify-between ${positionClasses}`}>
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
            TransactionRow={TransactionRow} transactionRowSize={54}
            TransactionTitleRow={TransactionTitleRow} titleRowSize={50}
        />

        <TagPicker
            variant="popup"
            open={showTagPicker}
            onOpenChange={setShowTagPicker}
            anchorPosition={popupAnchorPosition.current}
            selectedTagId={selectedTransaction?.tagId}
            setSelectedTag={(tag) => setTag(tag)} />

        {selectedTag && <BulkTagPrompt
            variant="dialog"
            open={showBulkTagPrompt}
            onOpenChange={onBulkTagPromptStateChange}
            TransactionRow={TransactionRow}
            description={`Found ${selectedTransactions.length} similar transactions. Do you want to update tags for them too?`}
            transactions={selectedTransactions}
            tagToApply={selectedTag} />}

    </>;
}

export default TransactionsTableView;
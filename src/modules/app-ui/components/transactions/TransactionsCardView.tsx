import { EntityName } from "@/modules/app/entities/entities";
import type { Transaction } from "@/modules/app/entities/Transaction";
import { ImportHandler } from "@/modules/app/import/ImportHandler";
import { Separator } from "@/modules/base-ui/components/ui/separator";
import { useDataSync } from "@/modules/data-sync/providers/DataSyncProvider";
import moment from "moment";
import { useRef, useState } from "react";
import { useEntity } from "../../providers/EntityProvider";
import AccountCell from "./cells/AccountCell";
import AmountCell from "./cells/AmountCell";
import DateCell from "./cells/DateCell";
import DescriptionCell from "./cells/DescriptionCell";
import TagCell from "./cells/TagCell";
import { TagPicker } from "./TagPicker";
import type { DateRowProps, TransactionRowProps } from "./TransactionVirtualizer";
import TransactionVirtualizer from "./TransactionVirtualizer";

type TransactionsCardViewProps = {
    transactions: Array<Transaction>;
}

const TransactionsCardView: React.FC<TransactionsCardViewProps> = ({ transactions }) => {
    const { orchestrator } = useDataSync();
    const { accountMap } = useEntity();

    const adaptersMap = useRef(ImportHandler.getAllAdapterMeta());

    const [showTagPicker, setShowTagPicker] = useState<boolean>(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

    const setTagId = (tagId: string | undefined) => {
        if (!selectedTransaction || !orchestrator) return;
        const repo = orchestrator.repo(EntityName.Transaction);
        selectedTransaction.tagId = tagId;
        repo.save({ ...selectedTransaction });
        setSelectedTransaction(null);
        setShowTagPicker(false);
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
                        {accountMap && <AccountCell
                            adapter={adaptersMap.current[accountMap[transaction.accountId].adapterName]}
                            account={accountMap[transaction.accountId]} />}
                    </div>
                </div>
            </div>
        </div>
    }

    const DateRow: React.FC<DateRowProps> = ({ item, date, style, active }) => {
        const className = `mx-4 px-4 py-1 w-fit font-semibold
            text-muted-foreground rounded-full
            ${active && `fixed top-16 bg-secondary/50 backdrop-blur border`}`;
        return <div key={item.key} data-index={item.index} style={style}>
            <div className={className}>
                {moment(date).format('MMMM YYYY')}
            </div>
        </div>
    }

    return <>
        <TransactionVirtualizer
            transactions={transactions}
            TransactionRow={TransactionRow} transactionRowSize={120}
            DateRow={DateRow} dateRowSize={40}
        />
        <TagPicker
            variant="sheet"
            open={showTagPicker}
            onOpenChange={setShowTagPicker}
            selectedTagId={selectedTransaction?.tagId}
            setSelectedTagId={(tagId) => setTagId(tagId)} />
    </>;
}

export default TransactionsCardView;
import { EntityName } from "@/modules/app/entities/entities";
import type { Transaction } from "@/modules/app/entities/Transaction";
import { ImportHandler } from "@/modules/app/import/ImportHandler";
import { Checkbox } from "@/modules/base-ui/components/ui/checkbox";
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
import TransactionVirtualizer, { type DateRowProps, type TransactionRowProps } from "./TransactionVirtualizer";

type TransactionsTableViewProps = {
    transactions: Array<Transaction>;
}

const TransactionsTableView: React.FC<TransactionsTableViewProps> = ({ transactions }) => {
    const { orchestrator } = useDataSync();
    const { accountMap } = useEntity();

    const adaptersMap = useRef(ImportHandler.getAllAdapterMeta());
    const popupAnchorPosition = useRef<DOMRect | undefined>(undefined);

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
            ${last ? 'rounded-b-lg' : ''}`;

        return <div key={item.key} data-index={item.index} style={style}>
            <div key={transaction.id} className={className}>
                <div className="w-12"><Checkbox className="ml-3" /></div>
                <div className="w-24"><DateCell date={transaction.transactionAt} /></div>
                <div className="w-40 text-xl"><AmountCell amount={transaction.amount} /></div>
                <div className="flex-1 truncate"><DescriptionCell transaction={transaction} editable /></div>
                <div className="w-48"><TagCell tagId={transaction.tagId ?? null} onClick={(e) => openTagPicker(e, transaction)} /></div>
                <div className="w-24">
                    {accountMap && <AccountCell
                        adapter={adaptersMap.current[accountMap[transaction.accountId].adapterName]}
                        account={accountMap[transaction.accountId]} />}
                </div>
            </div>
        </div>
    }

    const DateRow: React.FC<DateRowProps> = ({ item, date, active, style }) => {

        const className = `my-2 py-1 w-fit font-semibold 
            text-muted-foreground
            ${active && `fixed top-26 left-24 px-4 bg-secondary/50 
                backdrop-blur-xl rounded-full border mt-5`}`;

        return <div key={item.key} data-index={item.index} style={style}>
            <div className={className}>
                {moment(date).format('MMMM YYYY')}
            </div>
        </div>
    }

    return <>
        <TransactionVirtualizer
            transactions={transactions}
            TransactionRow={TransactionRow} transactionRowSize={54}
            DateRow={DateRow} dateRowSize={50}
        />
        <TagPicker
            variant="popup"
            open={showTagPicker}
            onOpenChange={setShowTagPicker}
            anchorPosition={popupAnchorPosition.current}
            selectedTagId={selectedTransaction?.tagId}
            setSelectedTagId={(tagId) => setTagId(tagId)} />
    </>;
}

export default TransactionsTableView;
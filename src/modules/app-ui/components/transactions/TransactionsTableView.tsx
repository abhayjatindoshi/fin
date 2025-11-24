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
            hover:bg-muted/50
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

    const DateRow: React.FC<DateRowProps> = ({ item, date, active, style }) => (
        <div key={item.key} data-index={item.index} style={style}>
            <div className={`my-2 py-1 w-fit font-semibold text-muted-foreground 
                ${active ? 'px-4 bg-secondary/50 backdrop-blur-xl rounded-full border' : 'mt-5'}`} style={style}>
                {moment(date).format('MMMM YYYY')}
            </div>
        </div>
    )

    // const borderStyleValue = '1px solid var(--border)';
    // const borderRadiusValue = 'calc(var(--radius))';

    // const styles = (item: VirtualItem) => {
    //     const style: CSSProperties = {
    //         top: 0,
    //         left: 0,
    //         width: '100%',
    //         height: `${item.size}px`,
    //     };

    //     if (isSticky(item.index)) {
    //         style.zIndex = 10;
    //     } else {
    //         style.borderLeft = borderStyleValue;
    //         style.borderRight = borderStyleValue;
    //         style.borderBottom = borderStyleValue;

    //         if (isFirstRow(item.index)) {
    //             style.borderTop = borderStyleValue;
    //             style.borderTopLeftRadius = borderRadiusValue;
    //             style.borderTopRightRadius = borderRadiusValue;
    //         } else if (isLastRow(item.index)) {
    //             style.borderBottomLeftRadius = borderRadiusValue;
    //             style.borderBottomRightRadius = borderRadiusValue;
    //         }
    //     }

    //     if (isActiveSticky(item.index)) {
    //         style.position = 'fixed';
    //         style.top = '116px';
    //         style.left = '6rem';
    //     } else {
    //         style.position = 'absolute';
    //         style.transform = `translateY(${item.start}px)`;
    //     }

    //     return style;
    // }

    return <>
        <TransactionVirtualizer
            transactions={transactions}
            TransactionRow={TransactionRow}
            DateRow={DateRow}
        />
        {/* <div className="h-full w-full overflow-auto">
            <div className="w-full relative" style={{ height: virtualizer.getTotalSize() + 'px' }}>
                {items.map(item => (
                    <div key={item.key} data-index={item.index} style={styles(item)}>
                        {rows[item.index] instanceof Date ?
                            <DateRow date={rows[item.index] as Date} active={isActiveSticky(item.index)} /> :
                            <TransactionRow tx={rows[item.index] as Transaction} />}
                    </div>
                ))}
            </div>
        </div> */}
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
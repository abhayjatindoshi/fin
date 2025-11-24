import { EntityName } from "@/modules/app/entities/entities";
import type { Transaction } from "@/modules/app/entities/Transaction";
import { ImportHandler } from "@/modules/app/import/ImportHandler";
import { Checkbox } from "@/modules/base-ui/components/ui/checkbox";
import { useDataSync } from "@/modules/data-sync/providers/DataSyncProvider";
import { defaultRangeExtractor, useVirtualizer, type Range, type VirtualItem } from "@tanstack/react-virtual";
import moment from "moment";
import { useCallback, useRef, useState, type CSSProperties } from "react";
import { useApp } from "../../providers/AppProvider";
import { useEntity } from "../../providers/EntityProvider";
import AccountCell from "./cells/AccountCell";
import AmountCell from "./cells/AmountCell";
import DateCell from "./cells/DateCell";
import DescriptionCell from "./cells/DescriptionCell";
import TagCell from "./cells/TagCell";
import { TagPicker } from "./TagPicker";

type TransactionsTableViewProps = {
    transactions: Array<Transaction> | null;
}

const constructRows = (transactions: Array<Transaction>): [Array<Transaction | Date>, Array<number>] => {
    const rows: Array<Transaction | Date> = [];
    const stickyIndices: Array<number> = [];
    let lasdivate: Date | null = null;

    const dateMatches = (l: Date, r: Date | null) => {
        if (!r) return false;
        return l.getFullYear() === r.getFullYear() &&
            l.getMonth() === r.getMonth()
    }

    for (const tx of transactions) {
        if (!dateMatches(tx.transactionAt, lasdivate)) {
            lasdivate = moment(0)
                .year(tx.transactionAt.getFullYear())
                .month(tx.transactionAt.getMonth()).toDate();
            stickyIndices.push(rows.length);
            rows.push(lasdivate);
        }
        rows.push(tx);
    }
    return [rows, stickyIndices];
}

const TransactionsTableView: React.FC<TransactionsTableViewProps> = ({ transactions }) => {
    const { orchestrator } = useDataSync();
    const { scrollElementRef } = useApp();
    const { accountMap } = useEntity();

    const adaptersMap = useRef(ImportHandler.getAllAdapterMeta());
    const popupAnchorPosition = useRef<DOMRect | undefined>(undefined);
    const activeStickyIndexRef = useRef<number>(0);

    const [showTagPicker, setShowTagPicker] = useState<boolean>(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

    const [rows, stickyIndices] = constructRows(transactions || []);
    const isSticky = (index: number) => rows[index] instanceof Date;
    const isActiveSticky = (index: number) => activeStickyIndexRef.current === index;
    const isFirstRow = (index: number) => stickyIndices.includes(index - 1);
    const isLastRow = (index: number) => stickyIndices.includes(index + 1) || index === rows.length - 1;

    const virtualizer = useVirtualizer({
        count: rows.length,
        overscan: 2,
        getScrollElement: () => scrollElementRef?.current ?? null,
        estimateSize: (index) => rows[index] instanceof Date ? 50 : 53,
        rangeExtractor: useCallback((range: Range) => {
            activeStickyIndexRef.current = [...stickyIndices]
                .reverse().find(i => range.startIndex >= i) ?? 0;

            const next = new Set([
                activeStickyIndexRef.current,
                ...defaultRangeExtractor(range),
            ])

            return [...next].sort((a, b) => a - b);
        }, [stickyIndices])
    })
    const items = virtualizer.getVirtualItems();

    const setTagId = (tagId: string | undefined) => {
        if (!selectedTransaction || !orchestrator) return;
        const repo = orchestrator.repo(EntityName.Transaction);
        selectedTransaction.tagId = tagId;
        repo.save({ ...selectedTransaction });
        setSelectedTransaction(null);
        setShowTagPicker(false);
    }

    const TransactionRow: React.FC<{ tx: Transaction }> = ({ tx }) => {

        const openTagPicker = (event: React.MouseEvent) => {
            event.stopPropagation();
            setSelectedTransaction(tx);
            const rect = event.currentTarget.getBoundingClientRect();
            popupAnchorPosition.current = rect;
            setShowTagPicker(true);
        }

        return <div key={tx.id} className="py-2 flex flex-row items-center gap-2 
                hover:bg-muted/50">
            <div className="w-12"><Checkbox className="ml-3" /></div>
            <div className="w-24"><DateCell date={tx.transactionAt} /></div>
            <div className="w-40 text-xl"><AmountCell amount={tx.amount} /></div>
            <div className="flex-1 truncate"><DescriptionCell transaction={tx} editable /></div>
            <div className="w-48"><TagCell tagId={tx.tagId ?? null} onClick={openTagPicker} /></div>
            <div className="w-24">
                {accountMap && <AccountCell
                    adapter={adaptersMap.current[accountMap[tx.accountId].adapterName]}
                    account={accountMap[tx.accountId]} />}
            </div>
        </div>
    }

    const DateRow: React.FC<{ date: Date, active: boolean }> = ({ date, active }) => (
        <div className={`my-2 py-1 w-fit font-semibold text-muted-foreground 
            ${active ? 'px-4 bg-secondary/50 backdrop-blur-xl rounded-full border' : 'mt-5'}`}>
            {moment(date).format('MMMM YYYY')}
        </div>
    )

    const borderStyleValue = '1px solid var(--border)';
    const borderRadiusValue = 'calc(var(--radius))';

    const styles = (item: VirtualItem) => {
        const style: CSSProperties = {
            top: 0,
            left: 0,
            width: '100%',
            height: `${item.size}px`,
        };

        if (isSticky(item.index)) {
            style.zIndex = 10;
        } else {
            style.borderLeft = borderStyleValue;
            style.borderRight = borderStyleValue;
            style.borderBottom = borderStyleValue;

            if (isFirstRow(item.index)) {
                style.borderTop = borderStyleValue;
                style.borderTopLeftRadius = borderRadiusValue;
                style.borderTopRightRadius = borderRadiusValue;
            } else if (isLastRow(item.index)) {
                style.borderBottomLeftRadius = borderRadiusValue;
                style.borderBottomRightRadius = borderRadiusValue;
            }
        }

        if (isActiveSticky(item.index)) {
            style.position = 'fixed';
            style.top = '116px';
            style.left = '6rem';
        } else {
            style.position = 'absolute';
            style.transform = `translateY(${item.start}px)`;
        }

        return style;
    }

    return <>
        <div className="h-full w-full overflow-auto">
            <div className="w-full relative" style={{ height: virtualizer.getTotalSize() + 'px' }}>
                {items.map(item => (
                    <div key={item.key} data-index={item.index} style={styles(item)}>
                        {rows[item.index] instanceof Date ?
                            <DateRow date={rows[item.index] as Date} active={isActiveSticky(item.index)} /> :
                            <TransactionRow tx={rows[item.index] as Transaction} />}
                    </div>
                ))}
            </div>
        </div>
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
import { EntityName } from "@/modules/app/entities/entities";
import type { Transaction } from "@/modules/app/entities/Transaction";
import { ImportHandler } from "@/modules/app/import/ImportHandler";
import { Separator } from "@/modules/base-ui/components/ui/separator";
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

type TransactionsCardViewProps = {
    transactions: Array<Transaction> | null;
}

const constructRows = (transactions: Array<Transaction>): [Array<Transaction | Date>, Array<number>] => {
    const rows: Array<Transaction | Date> = [];
    const stickyIndices: Array<number> = [];
    let lastDate: Date | null = null;

    const dateMatches = (l: Date, r: Date | null) => {
        if (!r) return false;
        return l.getFullYear() === r.getFullYear() &&
            l.getMonth() === r.getMonth()
    }

    for (const tx of transactions) {
        if (!dateMatches(tx.transactionAt, lastDate)) {
            lastDate = moment(0)
                .year(tx.transactionAt.getFullYear())
                .month(tx.transactionAt.getMonth()).toDate();
            stickyIndices.push(rows.length);
            rows.push(lastDate);
        }
        rows.push(tx);
    }
    return [rows, stickyIndices];
}

const TransactionsCardView: React.FC<TransactionsCardViewProps> = ({ transactions }) => {
    const { orchestrator } = useDataSync();
    const { scrollElementRef } = useApp();
    const { accountMap } = useEntity();
    const adaptersMap = useRef(ImportHandler.getAllAdapterMeta());
    const activeStickyIndexRef = useRef<number>(0);
    const [showTagPicker, setShowTagPicker] = useState<boolean>(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

    const [rows, stickyIndices] = constructRows(transactions || []);
    const isSticky = (index: number) => rows[index] instanceof Date;
    const isActiveSticky = (index: number) => activeStickyIndexRef.current === index;
    const virtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => scrollElementRef?.current ?? null,
        estimateSize: (index) => rows[index] instanceof Date ? 40 : 120,
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

        const openTagPicker = () => {
            setSelectedTransaction(tx);
            setShowTagPicker(true);
        }

        return <div key={tx.id} className="flex flex-col rounded-xl border mx-4">
            <div className="flex flex-row items-center justify-between gap-3 px-3 py-1">
                <div className="flex-1"><DescriptionCell transaction={tx} className="p-0" /></div>
                <div className="shrink-0"><DateCell date={tx.transactionAt} /></div>
            </div>
            <Separator />
            <div className="flex flex-row justify-between gap-3 p-3">
                <div className="text-3xl"><AmountCell amount={tx.amount} /></div>
                <div className="flex flex-row gap-3 items-center">
                    <TagCell tagId={tx.tagId ?? null} onClick={openTagPicker} />
                    {accountMap && <AccountCell
                        adapter={adaptersMap.current[accountMap[tx.accountId].adapterName]}
                        account={accountMap[tx.accountId]} />}
                </div>
            </div>
        </div >
    }

    const DateRow: React.FC<{ date: Date }> = ({ date }) => (
        <div className="mx-4 px-4 py-1 w-fit font-semibold text-muted-foreground 
            rounded-full bg-secondary/50 backdrop-blur border">
            {moment(date).format('MMMM YYYY')}
        </div>
    )

    const styles = (item: VirtualItem) => {
        const style: CSSProperties = {
            top: 0,
            left: 0,
            width: '100%',
            height: `${item.size}px`,
        };
        if (isSticky(item.index)) {
            style.zIndex = 10;
        }
        if (isActiveSticky(item.index)) {
            style.position = 'fixed';
            style.top = '4rem';
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
                            <DateRow date={rows[item.index] as Date} /> :
                            <TransactionRow tx={rows[item.index] as Transaction} />}
                    </div>
                ))}
            </div>
        </div>
        <TagPicker
            variant="sheet"
            open={showTagPicker}
            onOpenChange={setShowTagPicker}
            selectedTagId={selectedTransaction?.tagId}
            setSelectedTagId={(tagId) => setTagId(tagId)} />
    </>;
}

export default TransactionsCardView;
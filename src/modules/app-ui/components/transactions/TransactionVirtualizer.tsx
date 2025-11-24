import type { Transaction } from "@/modules/app/entities/Transaction";
import { defaultRangeExtractor, useVirtualizer, type Range, type VirtualItem } from "@tanstack/react-virtual";
import moment from "moment";
import { useCallback, useRef, type CSSProperties } from "react";
import { useApp } from "../../providers/AppProvider";

export type TransactionRowProps = {
    item: VirtualItem,
    transaction: Transaction,
    style: CSSProperties,
    first?: boolean,
    last?: boolean
}

export type DateRowProps = {
    item: VirtualItem,
    date: Date,
    style: CSSProperties,
    active?: boolean
}

type TransactionVirtualizerProps = {
    transactions: Array<Transaction>
    TransactionRow: React.FC<TransactionRowProps>
    transactionRowSize: number
    DateRow: React.FC<DateRowProps>
    dateRowSize: number
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

const TransactionVirtualizer: React.FC<TransactionVirtualizerProps> = ({
    transactions,
    TransactionRow, transactionRowSize,
    DateRow, dateRowSize
}) => {
    const { scrollElementRef } = useApp();
    const activeStickyIndexRef = useRef<number>(0);
    const [rows, stickyIndices] = constructRows(transactions);

    const isSticky = (index: number) => rows[index] instanceof Date;
    const isActiveSticky = (index: number) => activeStickyIndexRef.current === index;
    const isFirstRow = (index: number) => stickyIndices.includes(index - 1);
    const isLastRow = (index: number) => stickyIndices.includes(index + 1) || index === rows.length - 1;

    const virtualizer = useVirtualizer({
        count: rows.length,
        overscan: 2,
        getScrollElement: () => scrollElementRef?.current ?? null,
        estimateSize: (index) => rows[index] instanceof Date ? dateRowSize : transactionRowSize,
        rangeExtractor: useCallback((range: Range) => {
            activeStickyIndexRef.current = [...stickyIndices]
                .reverse().find(i => range.startIndex >= i) ?? 0;

            const next = new Set([
                activeStickyIndexRef.current,
                ...defaultRangeExtractor(range),
            ])

            return [...next].sort((a, b) => a - b);
        }, [stickyIndices])
    });

    const items = virtualizer.getVirtualItems();

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
            style.position = 'sticky';
        } else {
            style.position = 'absolute';
            style.transform = `translateY(${item.start}px)`;
        }

        return style;
    }

    return <div className="h-full w-full overflow-hidden">
        <div className="w-full relative" style={{ height: virtualizer.getTotalSize() + 'px' }}>
            {items.map(item => (
                rows[item.index] instanceof Date ?
                    <DateRow
                        key={item.key}
                        item={item}
                        date={rows[item.index] as Date}
                        active={isActiveSticky(item.index)}
                        style={styles(item)} /> :
                    <TransactionRow
                        key={item.key}
                        item={item}
                        transaction={rows[item.index] as Transaction}
                        style={styles(item)}
                        first={isFirstRow(item.index)}
                        last={isLastRow(item.index)} />
            ))}
        </div>
    </div>;
};

export default TransactionVirtualizer;
import type { Transaction } from "@/modules/app/entities/Transaction";
import { defaultRangeExtractor, useVirtualizer, type Range, type VirtualItem } from "@tanstack/react-virtual";
import moment from "moment";
import { useCallback, useRef, type CSSProperties } from "react";
import { useApp } from "../../providers/AppProvider";

type KeyIndex = {
    key: number | string | bigint;
    index: number;
}

export type TransactionRowProps = {
    item: KeyIndex,
    transaction: Transaction,
    style: CSSProperties,
    first?: boolean,
    last?: boolean
}

export type TransactionTitleProps = {
    item: KeyIndex,
    title: TransactionTitle,
    style: CSSProperties,
    active?: boolean
}

type TransactionVirtualizerProps = {
    transactions: Array<Transaction>
    TransactionRow: React.FC<TransactionRowProps>
    transactionRowSize: number
    TransactionTitleRow: React.FC<TransactionTitleProps>
    titleRowSize: number
}

export type TransactionTitle = {
    date: Date;
    count: number;
}

const constructRows = (transactions: Array<Transaction>): [Array<Transaction | TransactionTitle>, Array<number>] => {
    const rows: Array<Transaction | TransactionTitle> = [];
    const stickyIndices: Array<number> = [];
    let lastTitle: TransactionTitle = { date: new Date(0), count: 0 };

    const dateMatches = (l: Date, r: Date | null) => {
        if (!r) return false;
        return l.getFullYear() === r.getFullYear() &&
            l.getMonth() === r.getMonth()
    }

    for (const tx of transactions) {
        if (!dateMatches(tx.transactionAt, lastTitle.date)) {
            lastTitle = {
                date: moment(0)
                    .year(tx.transactionAt.getFullYear())
                    .month(tx.transactionAt.getMonth()).toDate(),
                count: 0
            };
            stickyIndices.push(rows.length);
            rows.push(lastTitle);
        }
        rows.push(tx);
        lastTitle.count += 1;
    }
    return [rows, stickyIndices];
}

const TransactionVirtualizer: React.FC<TransactionVirtualizerProps> = ({
    transactions,
    TransactionRow, transactionRowSize,
    TransactionTitleRow, titleRowSize
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
        estimateSize: (index) => 'count' in rows[index] ? titleRowSize : transactionRowSize,
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
            style.zIndex = 9;
        }

        if (isActiveSticky(item.index)) {
            style.position = 'sticky';
            style.zIndex = 10;
        } else {
            style.position = 'absolute';
            style.transform = `translateY(${item.start}px)`;
        }

        return style;
    }

    return <div className="h-full w-full overflow-hidden">
        <div className="w-full relative" style={{ height: virtualizer.getTotalSize() + 'px' }}>
            {items.map(item => (
                'count' in rows[item.index] ?
                    <TransactionTitleRow
                        key={item.key}
                        item={item}
                        title={rows[item.index] as TransactionTitle}
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
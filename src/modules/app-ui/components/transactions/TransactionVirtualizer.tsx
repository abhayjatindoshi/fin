import type { Transaction } from "@/modules/app/entities/Transaction";
import { defaultRangeExtractor, useVirtualizer, type Range } from "@tanstack/react-virtual";
import moment from "moment";
import { useCallback, useRef } from "react";
import { useApp } from "../../providers/AppProvider";

type TransactionVirtualizerProps = {
    transactions: Array<Transaction>
    TransactionRow: React.FC<{ transaction: Transaction }>
    DateRow: React.FC<{ date: Date, active: boolean }>
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

const TransactionVirtualizer: React.FC<TransactionVirtualizerProps> = ({ transactions, TransactionRow, DateRow }) => {
    const { scrollElementRef } = useApp();
    const activeStickyIndexRef = useRef<number>(0);
    const [rows, stickyIndices] = constructRows(transactions);
    const isSticky = (index: number) => rows[index] instanceof Date;
    const isActiveSticky = (index: number) => activeStickyIndexRef.current === index;

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
    });

    const items = virtualizer.getVirtualItems();

    return <div className="h-full w-full overflow-auto">
        <div className="w-full relative" style={{ height: virtualizer.getTotalSize() + 'px' }}>
            {items.map(item => (
                <div key={item.key} data-index={item.index} style={styles(item)}>
                    {rows[item.index] instanceof Date ?
                        <DateRow date={rows[item.index] as Date} active={isActiveSticky(item.index)} /> :
                        <TransactionRow transaction={rows[item.index] as Transaction} />}
                </div>
            ))}
        </div>
    </div>;
};

export default TransactionVirtualizer;
import { EntityName } from "@/modules/app/entities/entities";
import type { Transaction } from "@/modules/app/entities/Transaction";
import { ImportHandler } from "@/modules/app/import/ImportHandler";
import EmptyOpenBox from "@/modules/base-ui/components/illustrations/EmptyOpenBox";
import { Checkbox } from "@/modules/base-ui/components/ui/checkbox";
import { Separator } from "@/modules/base-ui/components/ui/separator";
import { Spinner } from "@/modules/base-ui/components/ui/spinner";
import { useDataSync } from "@/modules/data-sync/providers/DataSyncProvider";
import { useRef, useState } from "react";
import { useApp } from "../../providers/AppProvider";
import { useEntity } from "../../providers/EntityProvider";
import AccountCell from "./cells/AccountCell";
import AmountCell from "./cells/AmountCell";
import DateCell from "./cells/DateCell";
import DescriptionCell from "./cells/DescriptionCell";
import TagCell from "./cells/TagCell";
import { TagPicker } from "./TagPicker";

type TransactionsTableProps = {
    transactions: Array<Transaction> | null;
}

const TransactionsTable: React.FC<TransactionsTableProps> = ({ transactions }: TransactionsTableProps) => {

    const { orchestrator } = useDataSync();
    const { isMobile } = useApp();
    const { accountMap } = useEntity();

    const adaptersMap = useRef(ImportHandler.getAllAdapterMeta());
    const popupAnchorPosition = useRef<DOMRect | undefined>(undefined);

    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [showTagPicker, setShowTagPicker] = useState<boolean>(false);


    if (!accountMap || !transactions) {
        return <Spinner className="m-auto justify-center" />;
    }

    const setTagId = (tagId: string | undefined) => {
        if (!selectedTransaction || !orchestrator) return;
        const repo = orchestrator.repo(EntityName.Transaction);
        selectedTransaction.tagId = tagId;
        repo.save({ ...selectedTransaction });
        setSelectedTransaction(null);
        setShowTagPicker(false);
    }

    const TransactionRow: React.FC<{ tx: Transaction }> = ({ tx }: { tx: Transaction }) => {

        const openTagPicker = (event: React.MouseEvent<HTMLElement>) => {
            event.stopPropagation();
            setSelectedTransaction(tx);
            const rect = event.currentTarget.getBoundingClientRect();
            popupAnchorPosition.current = rect;
            setShowTagPicker(true);
        }


        if (isMobile) {
            return <li key={tx.id} className="flex flex-col rounded-xl border">
                <div className="flex flex-row items-center justify-between gap-3 px-3 py-1">
                    <div className="flex-1"><DescriptionCell transaction={tx} className="p-0" /></div>
                    <div className="shrink-0"><DateCell date={tx.transactionAt} /></div>
                </div>
                <Separator />
                <div className="flex flex-row justify-between gap-3 p-3">
                    <div className="text-3xl"><AmountCell amount={tx.amount} /></div>
                    <div className="flex flex-row gap-3 items-center">
                        <TagCell tagId={tx.tagId ?? null} onClick={openTagPicker} />
                        <div>
                            <AccountCell
                                adapter={adaptersMap.current[accountMap[tx.accountId].adapterName]}
                                account={accountMap[tx.accountId]} />
                        </div>
                    </div>
                </div>
            </li>
        }

        return <tr key={tx.id}
            className="hover:bg-muted/50 first:rounded-t-xl last:rounded-b-xl border">
            <td className="py-2 w-12"><Checkbox className="ml-3" /></td>
            <td className="py-2 w-24"><DateCell date={tx.transactionAt} /></td>
            <td className="py-2 w-40 text-xl"><AmountCell amount={tx.amount} /></td>
            <td className="py-2 pr-2 max-w-0 truncate"><DescriptionCell transaction={tx} editable /></td>
            <td className="py-2 w-48"><TagCell tagId={tx.tagId ?? null} onClick={openTagPicker} /></td>
            <td className="py-2 w-24">
                <AccountCell
                    adapter={adaptersMap.current[accountMap[tx.accountId].adapterName]}
                    account={accountMap[tx.accountId]} />
            </td>
        </tr>
    }

    if (transactions.length === 0) {
        return <div className="flex flex-col items-center mt-12">
            <EmptyOpenBox className="mx-auto opacity-50 [&>svg]:size-12" animated={false} />
            <span className="text-muted-foreground mt-4">No transactions found</span>
        </div>;
    }

    return <>
        {isMobile ?
            <ul className='flex flex-col gap-2 m-2'>
                {transactions && transactions.map(tx => <TransactionRow key={tx.id} tx={tx} />)}
            </ul> :
            <table className="my-4 border-collapse rounded-xl overflow-hidden w-full">
                <tbody>
                    {transactions && transactions.map(tx => <TransactionRow key={tx.id} tx={tx} />)}
                </tbody>
            </table>}
        <TagPicker variant={isMobile ? "sheet" : "popup"}
            anchorPosition={popupAnchorPosition.current}
            selectedTagId={selectedTransaction?.tagId}
            setSelectedTagId={(tagId) => setTagId(tagId)}
            open={showTagPicker} onOpenChange={setShowTagPicker} />
    </>;
}

export default TransactionsTable;
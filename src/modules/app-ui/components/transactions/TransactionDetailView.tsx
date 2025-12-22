import { EntityName } from "@/modules/app/entities/entities";
import type { Tag } from "@/modules/app/entities/Tag";
import type { Transaction } from "@/modules/app/entities/Transaction";
import { Separator } from "@/modules/base-ui/components/ui/separator";
import { Textarea } from "@/modules/base-ui/components/ui/textarea";
import { useDataSync } from "@/modules/data-sync/providers/DataSyncProvider";
import { ArrowDownCircle, ArrowLeft, ArrowUpCircle, Calendar, Download, File, NotebookPen, PencilLine, X } from "lucide-react";
import moment from "moment";
import { useEffect, useRef, useState } from "react";
import AccountNumber from "../../common/AccountNumber";
import { useApp } from "../../providers/AppProvider";
import { useEntity } from "../../providers/EntityProvider";
import AccountCell from "./cells/AccountCell";
import AmountCell from "./cells/AmountCell";
import TagCell from "./cells/TagCell";
import { TagPicker } from "./TagPicker";

type TransactionDetailViewProps = {
    transactionId: string;
    forceUpdate: () => void;
    close: () => void;
}

const TransactionDetailView: React.FC<TransactionDetailViewProps> = ({ transactionId, forceUpdate, close }) => {
    const { accountMap } = useEntity();
    const { orchestrator } = useDataSync();
    const { isMobile } = useApp();

    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [showTagPicker, setShowTagPicker] = useState<boolean>(false);
    const popupAnchorPosition = useRef<DOMRect | undefined>(undefined);
    const [title, setTitle] = useState('');
    const [saving, setSaving] = useState<boolean>(false);


    useEffect(() => {
        if (!transactionId) return;
        if (transactionId === transaction?.id) return;
        if (!orchestrator) return;
        const repo = orchestrator.repo(EntityName.Transaction);
        repo.get(transactionId).then((transaction) => {
            const tx = transaction as Transaction | null;
            setTransaction(tx);
            setTitle(tx?.title || '');
        });
    }, [transactionId, orchestrator]);

    if (!transaction) return null;
    const account = accountMap?.[transaction.accountId];


    const openTagPicker = (event: React.MouseEvent) => {
        event.stopPropagation();
        const rect = event.currentTarget.getBoundingClientRect();
        popupAnchorPosition.current = rect;
        setShowTagPicker(true);
    }

    const setTag = async (tag: Tag | null) => {
        if (!orchestrator) return;

        const repo = orchestrator.repo(EntityName.Transaction);
        transaction.tagId = tag?.id;
        repo.save({ ...transaction });
        setShowTagPicker(false);
        forceUpdate();
    }

    const saveChanges = () => {
        try {
            if (!orchestrator) return;
            const newTitle = title.trim();
            if (newTitle === transaction.title) return;

            setSaving(true);
            const repo = orchestrator.repo(EntityName.Transaction);
            transaction.title = title;
            repo.save({ ...transaction });
        } finally {
            setSaving(false);
            forceUpdate();
        }
    }

    const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter') {
            saveChanges();
            e.currentTarget.blur();
        } else if (e.key === 'Escape') {
            setTitle(transaction.title || '');
            e.currentTarget.blur();
        }
    }

    const TransactionDetailViewContent = () => (
        <div className="flex flex-col items-center gap-4 pb-4">
            <div className="text-4xl"><AmountCell amount={transaction.amount} /></div>
            <div className=""><TagCell tagId={transaction.tagId ?? null} onClick={(e) => openTagPicker(e)} /></div>
            <Separator />
            <div className="flex flex-row items-center gap-2 w-full px-4">
                <Calendar className="size-5" />
                {moment(transaction.transactionAt).format("dddd, Do MMM 'YY")}
            </div>
            <div className="flex flex-row items-center gap-2 w-full px-4">
                {transaction.amount < 0 ? <>
                    <ArrowUpCircle className="size-5" />
                    <span>Debited from </span>
                </> : <>
                    <ArrowDownCircle className="size-5" />
                    <span>Received in </span>
                </>}
                {account && <AccountNumber accountNumber={account.accountNumber} />}
                <div className="flex-1" />
                {account && <AccountCell account={account} />}
            </div>
            <Separator />
            <div className="flex flex-row items-center gap-2 w-full px-4 text-muted-foreground">
                <NotebookPen className="size-5" />
                <span>Notes</span>
            </div>
            <div className="px-4 w-full flex-1">
                <Textarea
                    placeholder="Start typing..."
                    disabled={saving}
                    value={title}
                    onKeyDown={onKeyDown}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={saveChanges}
                    className="h-full md:text-lg" />
            </div>
            <Separator />
            <div className="flex flex-row items-center gap-2 w-full px-4 text-muted-foreground">
                <PencilLine className="size-5" />
                <span>Narration</span>
            </div>
            <div className="px-4 w-full text-wrap break-words">
                {transaction.narration}
            </div>
            {transaction.source && <>
                <Separator />
                <div className="flex flex-row items-center gap-2 w-full px-4 text-muted-foreground">
                    <Download className="size-5" />
                    <span>Imported from</span>
                </div>
                <div className="px-4 w-full text-wrap break-words flex flex-row gap-2">
                    {transaction.source.type === 'file' ? <>
                        <span>{transaction.source.fileName}</span>
                        <File className="size-7" />
                    </> : <div className="px-4 w-full text-wrap break-words">
                        {transaction.source.email}
                    </div>}
                </div>
            </>}
        </div>
    )


    return <>
        {isMobile ? <div className="py-4">
            <ArrowLeft onClick={() => close()} className="m-4 cursor-pointer" />
            <TransactionDetailViewContent />
        </div> : <div className="sticky top-20 rounded-xl border w-96 h-[calc(100vh-6rem)] overflow-y-auto ">
            <X onClick={() => close()} className="ml-auto cursor-pointer m-2" />
            <TransactionDetailViewContent />
        </div>}


        <TagPicker
            variant={isMobile ? "sheet" : "popup"}
            open={showTagPicker}
            onOpenChange={setShowTagPicker}
            anchorPosition={popupAnchorPosition.current}
            selectedTagId={transaction.tagId}
            setSelectedTag={(tag) => setTag(tag)} />
    </>;
}

export default TransactionDetailView;
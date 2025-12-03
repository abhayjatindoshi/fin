import { EntityName } from "@/modules/app/entities/entities";
import type { Tag } from "@/modules/app/entities/Tag";
import type { Transaction } from "@/modules/app/entities/Transaction";
import { Button } from "@/modules/base-ui/components/ui/button";
import { Dialog, DialogContent } from "@/modules/base-ui/components/ui/dialog";
import { Sheet, SheetContent } from "@/modules/base-ui/components/ui/sheet";
import { useDataSync } from "@/modules/data-sync/providers/DataSyncProvider";
import { useState, type ReactNode } from "react";
import type { TransactionRowProps } from "./TransactionVirtualizer";

type BuildTagPromptProps = {
    variant: 'dialog' | 'sheet';
    open: boolean;
    onOpenChange: (open: boolean) => void;
    TransactionRow: React.FC<TransactionRowProps>;
    description: string | ReactNode;
    transactions: Array<Transaction>;
    tagToApply: Tag;
}

const BulkTagPrompt: React.FC<BuildTagPromptProps> = ({ variant, open, onOpenChange, TransactionRow, description, transactions, tagToApply }) => {

    const BulkTagPromptContainer: React.FC<{ className?: string }> = ({ className }) => {

        const [loading, setLoading] = useState(false);
        const { orchestrator } = useDataSync();

        const applyTagToTransactions = async () => {
            if (!orchestrator) return;
            setLoading(true);
            const transactionRepo = orchestrator.repo(EntityName.Transaction);
            for (const tx of transactions) {
                transactionRepo.save({ ...tx, tagId: tagToApply.id });
            }
            setLoading(false);
            onOpenChange(false);
        }

        return <div className={`${className} flex flex-col gap-4 p-4`}>
            {description}
            <div className="max-h-96 overflow-y-auto rounded-md">
                {transactions.map((tx, index) => (
                    <TransactionRow
                        key={tx.id}
                        style={{}}
                        transaction={tx}
                        first={index === 0}
                        last={index === transactions.length - 1}
                        item={{ key: tx.id || '', index }}
                    />
                ))}
            </div>
            <Button className={variant === 'sheet' ? "w-full" : "self-end"} variant="default" disabled={loading} onClick={applyTagToTransactions}>
                Apply tag "{tagToApply.name}" to {transactions.length} transactions
            </Button>
        </div>;
    }

    if (variant === 'sheet') {
        return <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="bg-popover">
                <BulkTagPromptContainer />
            </SheetContent>
        </Sheet>
    } else {
        return <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-2/3 sm:max-w-2/3">
                <BulkTagPromptContainer />
            </DialogContent>
        </Dialog>;
    }
}

export default BulkTagPrompt;
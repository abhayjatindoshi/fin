import { EntityName } from "@/modules/app/entities/entities";
import type { Transaction } from "@/modules/app/entities/Transaction";
import { Input } from "@/modules/base-ui/components/ui/input";
import { useDataSync } from "@/modules/data-sync/providers/DataSyncProvider";
import { useState } from "react";

type DescriptionCellProps = {
    transaction: Transaction;
    editable?: boolean;
    className?: string;
};

const DescriptionCell: React.FC<DescriptionCellProps> = ({ transaction, editable = false, className }) => {

    const { orchestrator } = useDataSync();
    const [editing, setEditing] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [title, setTitle] = useState(transaction.title || '');

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
            setEditing(false);
            setSaving(false);
        }
    }

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            saveChanges();
        } else if (e.key === 'Escape') {
            setEditing(false);
            setTitle(transaction.title || '');
        }
    }

    return <Input variant="ghost"
        className={`${className} hover:bg-muted disabled:opacity-100 truncate bg-transparent w-full text-left m-0 focus:ring-0 focus:border-0`}
        disabled={!editable || saving}
        placeholder={editing ? 'Start typing...' : transaction.narration}
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={saveChanges}
        onFocus={() => setEditing(true)}
    />
}

export default DescriptionCell;
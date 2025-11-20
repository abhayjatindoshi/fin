import { SystemTags } from "@/modules/app/common/SystemTags";
import { EntityName } from "@/modules/app/entities/entities";
import type { MoneyAccount } from "@/modules/app/entities/MoneyAccount";
import type { Tag } from "@/modules/app/entities/Tag";
import type { Transaction } from "@/modules/app/entities/Transaction";
import { ImportHandler } from "@/modules/app/import/ImportHandler";
import EmptyOpenBox from "@/modules/base-ui/components/illustrations/EmptyOpenBox";
import { Button } from "@/modules/base-ui/components/ui/button";
import { Checkbox } from "@/modules/base-ui/components/ui/checkbox";
import { Input } from "@/modules/base-ui/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/modules/base-ui/components/ui/popover";
import { Separator } from "@/modules/base-ui/components/ui/separator";
import { Sheet, SheetContent } from "@/modules/base-ui/components/ui/sheet";
import { Spinner } from "@/modules/base-ui/components/ui/spinner";
import { useDataSync } from "@/modules/data-sync/providers/DataSyncProvider";
import { withSync } from "@/modules/data-sync/ui/SyncedComponent";
import { Portal } from "@radix-ui/react-portal";
import { CircleX, Hash } from "lucide-react";
import moment from "moment";
import { useEffect, useRef, useState } from "react";
import { Subject, debounceTime } from "rxjs";
import AccountNumber from "../../common/AccountNumber";
import Money from "../../common/Money";
import ImportIcon from "../../icons/import/ImportIcon";
import TagIcons from "../../icons/tags/TagIcons";
import { useApp } from "../../providers/AppProvider";
import type { TransactionFilterOptions } from "./TransactionsFilter";

type TransactionsTableProps = {
    filter: TransactionFilterOptions
    accounts: Array<MoneyAccount>;
    tags: Array<Tag>;
}

const TransactionsTable: React.FC<TransactionsTableProps> = ({ filter, accounts }: TransactionsTableProps) => {

    const { orchestrator } = useDataSync();
    const { isMobile } = useApp();
    const adaptersMap = useRef(ImportHandler.getAllAdapterMeta());
    const [transactions, setTransactions] = useState<Array<Transaction> | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [tagSearchQuery, setTagSearchQuery] = useState<string>('');

    // tag selection dialog
    const tagSelectionRef = useRef<HTMLDivElement | null>(null);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [showTagDialog, setShowTagDialog] = useState<boolean>(false);

    useEffect(() => {
        if (!filter || !orchestrator) return;

        // Using RxJS for debouncing
        setLoading(true);
        const filterSubject = new Subject<TransactionFilterOptions>();
        const repo = orchestrator.repo(EntityName.Transaction);
        const subscription = filterSubject
            .pipe(debounceTime(300))
            .subscribe(async (filter) => {
                const query = {
                    sort: [{
                        field: 'transactionAt',
                        direction: filter.sort,
                    }],
                    years: filter.years,
                }
                return repo.observeAll(query).subscribe((data) => {
                    const transactions = data as Array<Transaction>;
                    setLoading(false);
                    setTransactions(transactions
                        .filter(t => !filter.accountIds || filter.accountIds.length == 0 || filter.accountIds.includes(t.accountId))
                        .filter(t => !filter.startDate || t.transactionAt >= filter.startDate!)
                        .filter(t => !filter.endDate || t.transactionAt <= filter.endDate!)
                        .filter(t => !filter.searchQuery || t.narration.toLowerCase().includes(filter.searchQuery.toLowerCase()))
                    );
                });
            });

        filterSubject.next(filter);

        return () => {
            subscription.unsubscribe();
            filterSubject.complete();
        };
    }, [filter]);

    const openTagDialog = async (event: React.MouseEvent<HTMLElement>, tx: Transaction) => {
        setSelectedTransaction(tx);
        setTagSearchQuery('');
        setShowTagDialog(true);
        if (isMobile || !tagSelectionRef.current) return;
        const rect = event.currentTarget.getBoundingClientRect();
        tagSelectionRef.current.style.position = 'fixed';
        tagSelectionRef.current.style.top = `${rect.bottom}px`;
        tagSelectionRef.current.style.left = `${rect.left}px`;
    }

    const setTag = (tag: Tag) => {
        if (!selectedTransaction || !orchestrator) return;
        const repo = orchestrator.repo(EntityName.Transaction);
        selectedTransaction.tagId = tag.id;
        repo.save({ ...selectedTransaction });
        setSelectedTransaction(null);
        setShowTagDialog(false);
    }

    const BankIcon = (accountId: string) => {
        const account = accounts.find(a => a.id === accountId);
        if (!account) return null;
        const adapterMeta = adaptersMap.current[account.adapterName];
        if (!adapterMeta) return null;
        const Icon = ImportIcon[adapterMeta.display.icon];
        if (!Icon) return null;
        return <Popover>
            <PopoverTrigger asChild>
                <Icon className="size-5 text-muted-foreground" />
            </PopoverTrigger>
            <PopoverContent className="flex flex-row items-center py-2 px-3 justify-between w-48">
                <Icon className="size-8" />
                <div className="flex flex-col items-end">
                    <span className="uppercase font-semibold truncate">{adapterMeta.display.bankName}</span>
                    <span className="text-sm text-muted-foreground"><AccountNumber accountNumber={account.accountNumber} /></span>
                </div>
            </PopoverContent>
        </Popover>
    }

    const DescriptionCell: React.FC<{ tx: Transaction }> = ({ tx }) => {
        const [editing, setEditing] = useState<boolean>(false);
        const [saving, setSaving] = useState<boolean>(false);
        const [title, setTitle] = useState<string>(tx.title || '');

        const saveChanges = () => {
            try {
                if (!orchestrator) return;
                const newTitle = title.trim();
                if (newTitle === tx.title) return;

                setSaving(true);
                const repo = orchestrator.repo(EntityName.Transaction);
                tx.title = title;
                repo.save({ ...tx });
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
                setTitle(tx.title || '');
            }
        }

        if (editing) {
            return <Input className="text-lg p-2 m-0.5"
                variant="ghost"
                placeholder="Start typing..."
                autoFocus
                value={title} disabled={saving}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={onKeyDown}
                onBlur={saveChanges}
            />
        } else {
            const hasTitle = tx.title && tx.title.trim() !== '';

            return <div className={`hover:bg-muted p-2 rounded-lg cursor-pointer truncate ${!hasTitle && 'text-muted-foreground'}`} onClick={() => setEditing(true)}>
                {hasTitle ? tx.title : tx.narration}
            </div>
        }
    }

    const TransactionRow: React.FC<{ tx: Transaction }> = ({ tx }) => {
        const DateCell = <div className="flex flex-col">
            <span className="text-sm">{moment(tx.transactionAt).format('MMM DD')}</span>
            <span className="text-xs text-muted-foreground">{moment(tx.transactionAt).format("'YY")}</span>
        </div>;

        const MoneyCell = <Money amount={tx.amount} />;

        const TagCell = <Button variant="secondary" size="sm" className="m-0 cursor-pointer" onClick={(event) => openTagDialog(event, tx)}>
            {tx.tagId !== undefined ?
                <>{TagIcon(SystemTags[tx.tagId].icon, false, "size-5")} <span className="text-sm">{SystemTags[tx.tagId].name}</span></> :
                <><Hash className="text-muted-foreground" /> <span className="text-muted-foreground">Add tag</span></>
            }
        </Button>;

        const AccountIcon = BankIcon(tx.accountId);

        if (isMobile) {
            return <li key={tx.id} className="flex flex-col rounded-xl border">
                <div className="flex flex-row justify-between gap-3 px-3 py-1">
                    <div className="truncate"><DescriptionCell tx={tx} /></div>
                    <div className="shrink-0">{DateCell}</div>
                </div>
                <Separator />
                <div className="flex flex-row justify-between gap-3 p-3">
                    <div className="text-3xl">{MoneyCell}</div>
                    <div className="flex flex-row gap-3 items-center">
                        {TagCell}
                        <div>{AccountIcon}</div>
                    </div>
                </div>
            </li>
        }

        return <div key={tx.id} className="flex flex-row items-center gap-3 p-3 hover:bg-muted/50 first:rounded-t-xl last:rounded-b-xl border-b last:border-0">
            <Checkbox />
            <div className="w-24">{DateCell}</div>
            <div className="w-40 text-xl">{MoneyCell}</div>
            <div className="flex-1 truncate"><DescriptionCell tx={tx} /></div>
            <div className="w-48">{TagCell}</div>
            <div className="w-24">{AccountIcon}</div>
        </div>
    }

    if (loading) {
        return <Spinner className="m-auto justify-center" />;
    }

    if (!transactions || transactions.length === 0) {
        return <div className="flex flex-col items-center mt-12">
            <EmptyOpenBox className="mx-auto opacity-50 [&>svg]:size-12" animated={false} />
            <span className="text-muted-foreground mt-4">No transactions found</span>
        </div>;
    }

    const deleteAll = async () => {
        if (!orchestrator) return;
        const repo = orchestrator.repo(EntityName.Transaction);
        transactions
            .map(tx => tx.id)
            .filter(id => id != null)
            .forEach(repo.delete.bind(repo));
    }

    const TagIcon = (icon: string, parent: boolean, className?: string) => {
        const IconComponent = TagIcons[icon];
        const classes = icon === 'binary' ? 'text-red-500' : 'text-foreground';
        if (IconComponent) {
            if (parent) return <IconComponent className={`w-12 h-12 p-3 rounded-lg hover:bg-gradient-to-br bg-gradient-to-tl from-accent/30 to-muted/30 ${classes} ${className}`} />;
            return <IconComponent className={`size-4 ${classes} ${className}`} />;
        }
        return <CircleX className={`size-4 ${classes} ${className}`} />;
    }

    const TagPicker = () => {
        return <div className="flex flex-col gap-4 overflow-auto max-h-96">
            <div className="sticky top-0 px-3 py-1 rounded-t-2xl w-full">
                <Input className="bg-muted/50 backdrop-blur-lg" autoFocus value={tagSearchQuery} onChange={e => setTagSearchQuery(e.target.value)} placeholder="Search tags..." />
            </div>
            {Object.values(SystemTags)
                .filter(t => !t.parent)
                .filter(t => tagSearchQuery === '' ||
                    t.name.toLowerCase().includes(tagSearchQuery.toLowerCase()) ||
                    t.description?.toLowerCase().includes(tagSearchQuery.toLowerCase()) ||
                    Object.values(SystemTags).filter(st => st.parent == t.id)
                        .some(st => st.name.toLowerCase().includes(tagSearchQuery.toLowerCase()))
                )
                .map(tag => (
                    <div key={tag.id}
                        onClick={() => setTag(tag)}
                        className="flex flex-col gap-2 mx-2 hover:bg-muted/50 rounded-lg p-2 cursor-pointer">
                        <div className="flex flex-row items-center gap-2">
                            {TagIcon(tag.icon, true)}
                            <div className="flex flex-col">
                                <span>{tag.name}</span>
                                <span className="text-muted-foreground">{tag.description}</span>
                            </div>
                        </div>
                        {tag.id && <div className="flex flex-row flex-wrap mt-2 items-center">
                            {Object.values(SystemTags)
                                .filter(subtag => subtag.parent === tag.id)
                                .filter(subtag => tagSearchQuery === '' ||
                                    tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase()) ||
                                    tag.description?.toLowerCase().includes(tagSearchQuery.toLowerCase()) ||
                                    subtag.name.toLowerCase().includes(tagSearchQuery.toLowerCase())
                                )
                                .map(subtag => (
                                    <div key={subtag.id}
                                        onClick={e => { e.stopPropagation(); setTag(subtag); }}
                                        className="flex flex-row items-center gap-2 hover:bg-background/50 rounded-lg p-2 cursor-pointer">
                                        {TagIcon(subtag.icon, false)}
                                        <span>{subtag.name}</span>
                                    </div>
                                ))}
                        </div>}
                    </div>
                ))}
        </div>
    }

    return <>
        <Button variant="destructive" size="sm" className="w-24" onClick={deleteAll}>Delete All</Button>
        <ul className={`flex flex-col ${isMobile ? 'gap-2 m-2' : 'my-4 border rounded-xl'}`}>
            {transactions && transactions.map(tx => <TransactionRow key={tx.id} tx={tx} />)}
        </ul>
        {isMobile ?
            <Sheet open={showTagDialog} onOpenChange={() => setShowTagDialog(false)}>
                <SheetContent side="bottom">
                    <div className="text-xl px-4 pt-4">Select a tag</div>
                    <TagPicker />
                </SheetContent>
            </Sheet> :
            <Portal className={showTagDialog ? "block" : "hidden"}>
                <div className="absolute top-0 left-0 bg-background/50 w-full h-full z-10" onClick={() => setShowTagDialog(false)}>
                    <div ref={tagSelectionRef} className="flex flex-col border m-2 pt-2 rounded-2xl z-12 bg-muted/50 backdrop-blur-lg" onClick={(event) => event.stopPropagation()}>
                        <TagPicker />
                    </div>
                </div>
            </Portal>}
    </>;
}

const synced = withSync(
    (orchestrator) => {
        const accounts = orchestrator.repo(EntityName.MoneyAccount).observeAll();
        const tags = orchestrator.repo(EntityName.Tag).observeAll();
        return { accounts, tags };
    },
    TransactionsTable
);
export default synced;
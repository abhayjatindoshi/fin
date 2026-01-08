import { EntityName } from "@/modules/app/entities/entities";
import type { MoneyAccount } from "@/modules/app/entities/MoneyAccount";
import { FileImportProcessContext } from "@/modules/app/import/context/FileImportProcessContext";
import type { ImportProcessStatus } from "@/modules/app/import/context/ImportProcessContext";
import { AccountSelectionError, AdapterSelectionError, FilePasswordError, PromptError, RequireConfirmation } from "@/modules/app/import/errors/PromptError";
import { ImportMatrix } from "@/modules/app/import/ImportMatrix";
import type { IBank } from "@/modules/app/import/interfaces/IBank";
import type { IBankOffering } from "@/modules/app/import/interfaces/IBankOffering";
import type { IImportAdapter } from "@/modules/app/import/interfaces/IImportAdapter";
import { Button } from "@/modules/base-ui/components/ui/button";
import { Input } from "@/modules/base-ui/components/ui/input";
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/modules/base-ui/components/ui/item";
import { Spinner } from "@/modules/base-ui/components/ui/spinner";
import { useDataSync } from "@/modules/data-sync/providers/DataSyncProvider";
import { Clock, FileIcon, FileText, Hourglass, SquareCheck, SquareX } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type JSX } from "react";
import AccountNumber from "../../common/AccountNumber";
import FileSize from "../../common/FileSize";
import { ImportIconComponent } from "../../icons/import/ImportIcon";

type ImportPageProps = {
    files: File[];
    close: () => void;
}

const ImportComponent: React.FC<ImportPageProps> = ({ files, close }) => {

    const context = useRef<FileImportProcessContext | null>(null);
    const [status, setStatus] = useState<ImportProcessStatus>('pending');

    useEffect(() => {
        if (files.length !== 1) return;

        const file = files[0];
        if (context.current) {
            if (context.current.file === file) return;
            else context.current.cancel();
        }

        const newContext = new FileImportProcessContext(file);
        const subscription = newContext.observeStatus().subscribe(setStatus);
        newContext.startOrResume();
        context.current = newContext;

        return () => {
            context.current = null;
            subscription.unsubscribe();
        }
    }, [files]);

    const statusIcon = (status: ImportProcessStatus, className?: string): JSX.Element => {
        switch (status) {
            case 'pending':
                return <Clock className={`scale-150 ${className}`} />;
            case 'in_progress':
                return <Hourglass className={`scale-150 animate-spin ${className}`} />;
            case 'cancelling':
            case 'cancelled':
                return <SquareX className={`scale-150 ${className}`} />;
            case 'completed':
                return <SquareCheck className={`scale-150 text-accent ${className}`} />;
            case 'error':
            case 'prompt_error':
                return <SquareX className={`scale-150 text-destructive ${className}`} />;
        }
    };

    const fileIcon = (file: File, className?: string) => {
        if (file.type === 'application/pdf') return <FileText className={`scale-150 ${className}`} />;
        return <FileIcon className={`scale-150 ${className}`} />;
    }


    const PasswordPrompt = ({ error }: { error: FilePasswordError }) => {

        const [passwordInputText, setPasswordInputText] = useState("");
        const [errorMessage, setErrorMessage] = useState<string | null>(null);

        const submit = async () => {
            const success = await error.tryAndStorePassword(passwordInputText)
            if (!success) {
                setErrorMessage("Incorrect password. Please try again.");
            }
        }

        return <div>
            <div className="text-lg">Password Required</div>
            <div className="text-sm text-muted-foreground">The file appears to be password protected. Enter password to retry.</div>
            <div className="flex flex-col gap-2 mt-2">
                <Input type="password" placeholder="Enter file password..." value={passwordInputText} onChange={e => setPasswordInputText(e.target.value)} />
                <Button disabled={!passwordInputText} onClick={submit}>Import</Button>
                {errorMessage && <div className="text-sm text-destructive">{errorMessage}</div>}
            </div>
        </div>;
    }

    const AdapterPrompt = ({ error }: { error: AdapterSelectionError }) => {

        const supportedBanks = error.adapters.map(a => ({
            bank: ImportMatrix.AdapterBankData[a.id]?.[0] ?? undefined,
            offering: ImportMatrix.AdapterBankData[a.id]?.[1] ?? undefined,
            adapter: a
        }));

        const selectAdapter = (adapter: IImportAdapter) => {
            error.selectAdapter(adapter);
        };

        return <div>
            <div className="text-lg">Select account</div>
            <div className="text-sm text-muted-foreground">Multiple accounts detected. Choose one to continue.</div>
            <div className="flex flex-col gap-2 mt-2">
                {supportedBanks.map(({ bank, offering, adapter }) =>
                    <Item key={adapter.id} variant="outline" className="hover:bg-muted cursor-pointer" onClick={() => selectAdapter(adapter)}>
                        <ItemMedia variant="image">
                            <ImportIconComponent name={bank?.display?.icon} />
                        </ItemMedia>
                        <ItemContent>
                            <ItemTitle>{bank?.display?.name}</ItemTitle>
                            <ItemDescription>{offering?.display?.name}</ItemDescription>
                        </ItemContent>
                    </Item>)}
            </div>
        </div>
    }

    const AccountPrompt = ({ error }: { error: AccountSelectionError }) => {

        type AccountGroup = {
            bank: IBank | undefined;
            offering: IBankOffering | undefined;
            account: MoneyAccount;
        }

        const { orchestrator } = useDataSync();
        const [loading, setLoading] = useState<boolean>(true);
        const [accounts, setAccounts] = useState<AccountGroup[]>([]);

        const loadAccounts = useCallback(async () => {
            if (!orchestrator) return;
            setLoading(true);

            try {
                const repo = orchestrator.repo(EntityName.MoneyAccount);
                const accounts = await repo.getAll() as MoneyAccount[];
                const accountMap = accounts.reduce<Record<string, MoneyAccount>>((map, account) => {
                    map[account.id!] = account;
                    return map;
                }, {} as Record<string, MoneyAccount>);

                const foundAccounts = error.accountIds.map(accountId => {
                    const account = accountMap[accountId];
                    const bank = ImportMatrix.Banks[account.bankId] ?? undefined;
                    const offering = bank?.offerings?.find(o => o.id === account.offeringId);
                    return { bank, offering, account };
                });

                setAccounts(foundAccounts);
            } finally {
                setLoading(false);
            }

        }, [orchestrator, error.accountIds]);

        useEffect(() => {
            loadAccounts();
        }, [loadAccounts]);

        const selectAccount = (account: MoneyAccount) => {
            if (!account.id) return;
            error.selectAccount(account.id);
        }

        return <div>
            <div className="text-lg">Multiple matching accounts found</div>
            <div className="text-sm text-muted-foreground">Multiple accounts detected. Choose one to continue.</div>
            <div className="flex flex-col items-center gap-2 mt-2">
                {loading && <Spinner />}
                {accounts.map(({ bank, offering, account }) => (
                    <Item key={`${account.id}`} variant="outline" className="hover:bg-muted cursor-pointer" onClick={() => selectAccount(account)}>
                        <ItemMedia variant="image">
                            <ImportIconComponent name={bank?.display?.icon ?? ''} />
                        </ItemMedia>
                        <ItemContent>
                            <div className="flex flex-row justify-between w-full">
                                <div>
                                    <ItemTitle>
                                        {bank?.display?.name && <span className="uppercase">{bank?.display?.name}</span>}
                                    </ItemTitle>
                                    <ItemDescription className="flex justify-between">
                                        {offering?.display?.name && <span className="text-sm text-muted-foreground">{offering?.display?.name}</span>}
                                    </ItemDescription>
                                </div>
                                <span className="text-xl"><AccountNumber accountNumber={account.accountNumber} /></span>
                            </div>
                        </ItemContent>
                    </Item>
                ))}
            </div>
        </div>
    }

    const FinalPrompt = ({ error }: { error: RequireConfirmation }) => {

        const applyImport = () => {
            error.confirmImport();
        }

        const importData = error.context.data;
        const transactions = error.context.parsedTransactions ?? [];
        const transactionCount = transactions.length;
        const newTransactionCount = transactions.filter(tx => tx.isNew).length;
        const existingTransactionCount = transactionCount - newTransactionCount;
        const [bank, offering] = ImportMatrix.AdapterBankData[error.context.adapter?.id ?? ''] ?? [undefined, undefined];

        return (<>
            <Item variant="outline">
                <ItemMedia variant="image">
                    <ImportIconComponent name={bank?.display?.icon} />
                </ItemMedia>
                <ItemContent>
                    <div className="flex flex-row justify-between w-full">
                        <div>
                            <ItemTitle>
                                {bank?.display?.name && <span className="uppercase">{bank?.display?.name}</span>}
                            </ItemTitle>
                            <ItemDescription className="flex justify-between">
                                {offering?.display?.name && <span className="text-sm text-muted-foreground">{offering?.display?.name}</span>}
                            </ItemDescription>
                        </div>
                        <span className="text-xl"><AccountNumber accountNumber={importData?.account?.accountNumber?.[0] ?? ''} /></span>
                    </div>
                </ItemContent>
            </Item>
            <span>Detected <span className="text-accent">{transactionCount} transaction</span> records. </span>
            {existingTransactionCount > 0 &&
                <span>Out of which there are <span className="text-accent">{newTransactionCount} new transactions </span>
                    and <span className="text-destructive">{existingTransactionCount} duplicate transactions</span> that are already imported.
                </span>
            }
            <div className="flex flex-row justify-end gap-2">
                <Button variant="outline" onClick={close}>Cancel</Button>
                <Button disabled={newTransactionCount === 0} onClick={applyImport}>Import</Button>
            </div>
        </>);
    }

    return <>
        {files.length > 1 && <div>Multiple files detected. Please import one file at a time.</div>}

        {context.current && <Item key={context.current.file.name}>
            <ItemMedia variant="image">
                {fileIcon(context.current.file, 'shrink-0')}
            </ItemMedia>
            <ItemContent className="w-36">
                <ItemTitle className="w-full"><span className="truncate">{context.current.file.name}</span></ItemTitle>
                <ItemDescription><FileSize file={context.current.file} /></ItemDescription>
            </ItemContent>
            <ItemActions>
                {statusIcon(status, 'shrink-0')}
            </ItemActions>
        </Item>}

        {context.current?.error instanceof PromptError ? <>
            {context.current.error.errorType === 'file_password' && <PasswordPrompt error={context.current.error as FilePasswordError} />}
            {context.current.error.errorType === 'adapter_selection' && <AdapterPrompt error={context.current.error as AdapterSelectionError} />}
            {context.current.error.errorType === 'account_selection' && <AccountPrompt error={context.current.error as AccountSelectionError} />}
            {context.current.error.errorType === 'require_confirmation' && <FinalPrompt error={context.current.error as RequireConfirmation} />}
        </> :
            <div className="text-destructive">{context.current?.error?.message}</div>
        }
    </>;
}

export default ImportComponent;
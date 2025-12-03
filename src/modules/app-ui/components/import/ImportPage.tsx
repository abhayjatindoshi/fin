import type { MoneyAccount } from "@/modules/app/entities/MoneyAccount";
import { ImportMatrix } from "@/modules/app/import/ImportMatrix";
import type { IFile, IFileImportAdapter } from "@/modules/app/import/interfaces/IFileImportAdapter";
import { ImportService, type ImportResult, type PasswordPrompt } from "@/modules/app/services/ImportService";
import { Button } from "@/modules/base-ui/components/ui/button";
import { Input } from "@/modules/base-ui/components/ui/input";
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/modules/base-ui/components/ui/item";
import { Clock, FileIcon, FileText, Hourglass, SquareCheck, SquareX } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type JSX } from "react";
import AccountNumber from "../../common/AccountNumber";
import { useForceUpdate } from "../../common/ComponentUtils";
import FileSize from "../../common/FileSize";
import { ImportIconComponent } from "../../icons/import/ImportIcon";


type ImportPageProps = {
    files: File[];
    close: () => void;
}

type ImportStatus =
    | 'readingFile'
    | 'passwordPrompt'
    | 'findingAdapters'
    | 'adapterPrompt'
    | 'parsing'
    | 'accountPrompt'
    | 'finalPrompt'
    | 'importing'
    | 'imported'
    | 'error'
    ;

const ImportPage: React.FC<ImportPageProps> = ({ files, close }: ImportPageProps) => {

    const statusIcon = (status: ImportStatus, className?: string): JSX.Element => {
        switch (status) {
            case 'passwordPrompt':
            case 'adapterPrompt':
            case 'accountPrompt':
            case 'finalPrompt':
                return <Clock className={`scale-150 ${className}`} />;
            case 'readingFile':
            case 'findingAdapters':
            case 'parsing':
            case 'importing':
                return <Hourglass className={`scale-150 animate-spin ${className}`} />;
            case 'imported':
                return <SquareCheck className={`scale-150 text-accent ${className}`} />;
            case 'error':
                return <SquareX className={`scale-150 text-destructive ${className}`} />;
        }
    };

    const fileIcon = (file: File, className?: string) => {
        if (file.type === 'application/pdf') return <FileText className={`scale-150 ${className}`} />;
        return <FileIcon className={`scale-150 ${className}`} />;
    }

    const importService = useRef(new ImportService());
    const promiseRef = useRef<Promise<void>>(Promise.resolve());
    const status = useRef<ImportStatus>('readingFile');
    const password = useRef("");
    const openFile = useRef<IFile | null>(null);
    const importError = useRef<Error | null>(null);
    const passwordPrompt = useRef<PasswordPrompt | null>(null);
    const supportedAdapters = useRef<IFileImportAdapter<any>[] | null>(null);
    const selectedAdapter = useRef<IFileImportAdapter<any> | null>(null);
    const selectedAccount = useRef<MoneyAccount | null>(null);
    const importResult = useRef<ImportResult | null>(null);
    const forceUpdate = useForceUpdate();

    const runImport = useCallback(async (): Promise<ImportStatus> => {
        try {
            switch (status.current) {
                case 'readingFile': {
                    const result = await importService.current.readFile(files[0], password.current);
                    if (result === null) {
                        importError.current = new Error('Failed to import file.');
                        return 'error';
                    }
                    if ('message' in result) {
                        passwordPrompt.current = result;
                        return 'passwordPrompt';
                    } else {
                        openFile.current = result;
                        return 'findingAdapters';
                    }
                }
                case 'passwordPrompt': {
                    // wait for user to enter password and retry
                    return 'passwordPrompt';
                }
                case 'findingAdapters': {
                    if (!openFile.current) return 'readingFile';
                    const result = importService.current.getSupportedFileAdapters(openFile.current);
                    supportedAdapters.current = result;
                    if (result.length === 1) {
                        selectedAdapter.current = result[0];
                        return 'importing';
                    } else {
                        return 'adapterPrompt';
                    }
                }
                case 'adapterPrompt': {
                    // wait for user to select adapter
                    return 'adapterPrompt';
                }
                case 'parsing': {
                    if (!selectedAdapter.current) return 'findingAdapters';
                    if (!openFile.current) return 'readingFile';
                    const result = await importService.current.importFile(openFile.current, selectedAdapter.current);
                    if (result instanceof Error) {
                        importError.current = result;
                        return 'error';
                    } else {
                        importResult.current = result;
                        if (result.importedAccounts.length === 1) {
                            selectedAccount.current = result.importedAccounts[0];
                            return 'finalPrompt';
                        } else {
                            return 'accountPrompt';
                        }
                    }
                }
                case 'accountPrompt': {
                    // wait for user to select account
                    return 'accountPrompt';
                }
                case 'finalPrompt': {
                    // wait for user to confirm import
                    return 'finalPrompt';
                }
                case 'importing': {
                    if (!importResult.current || !selectedAccount.current) return 'parsing';
                    importResult.current.importedAccounts = [selectedAccount.current];
                    await importService.current.applyImport(importResult.current);
                    return 'imported';
                }
                case 'imported': {
                    // display success and wait for user to close
                    return 'imported';
                }
                case 'error': {
                    // display error and wait for user to close
                    return 'error';
                }
            }
        } catch (error) {
            importError.current = error as Error;
            return 'error';
        }
    }, [status, files, password, openFile, selectedAdapter, importResult]);

    const triggerNextStep = async (setStatus: ImportStatus) => {
        status.current = setStatus;
        while (true) {
            let currentStatus = status.current;
            promiseRef.current = promiseRef.current
                .then(runImport)
                .then((newStatus) => { status.current = newStatus });
            await promiseRef.current;
            forceUpdate();
            if (currentStatus === status.current) break;
        }
    }

    useEffect(() => {
        triggerNextStep('readingFile');
    }, []);

    const PasswordPrompt = () => {
        if (!passwordPrompt) return null;

        const [passwordInputText, setPasswordInputText] = useState("");

        const importFile = () => {
            password.current = passwordInputText;
            triggerNextStep('readingFile');
        }

        return <div>
            <div className="text-lg">Password Required</div>
            <div className="text-sm text-muted-foreground">The file appears to be password protected. Enter password to retry.</div>
            <div className="flex flex-col gap-2 mt-2">
                <Input type="password" placeholder="Enter file password..." value={passwordInputText} onChange={e => setPasswordInputText(e.target.value)} />
                <Button disabled={!passwordInputText} onClick={importFile}>Import</Button>
                {passwordPrompt.current?.message && <div className="text-sm text-destructive">{passwordPrompt.current.message}</div>}
            </div>
        </div>;
    }

    const AdapterPrompt = () => {
        if (!supportedAdapters.current) return null;

        const supportedBanks = supportedAdapters.current.map(a => ({
            bank: ImportMatrix.AdapterBankData[a.id]?.[0] ?? undefined,
            offering: ImportMatrix.AdapterBankData[a.id]?.[1] ?? undefined,
            adapter: a
        }));

        const selectAdapter = (adapter: IFileImportAdapter<any>) => {
            selectedAdapter.current = adapter;
            triggerNextStep('parsing');
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

    const AccountPrompt = () => {
        if (!importResult.current) return null;

        const foundAccounts = importResult.current.importedAccounts.map(account => {
            const bank = ImportMatrix.Banks[account.bankId] ?? undefined;
            const offering = bank?.offerings?.find(o => o.id === account.offeringId);
            return { bank, offering, account };
        });

        const setAccount = (account: MoneyAccount) => {
            selectedAccount.current = account;
            triggerNextStep('finalPrompt');
        }

        return <div>
            <div className="text-lg">Multiple matching accounts found</div>
            <div className="text-sm text-muted-foreground">Multiple accounts detected. Choose one to continue.</div>
            <div className="flex flex-col gap-2 mt-2">
                {foundAccounts.map(({ bank, offering, account }) => (
                    <Item key={`${account.id}`} variant="outline" className="hover:bg-muted cursor-pointer" onClick={() => setAccount(account)}>
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
                                <span className="text-xl"><AccountNumber accountNumber={account.accountNumber} /></span>
                            </div>
                        </ItemContent>
                    </Item>
                ))}
            </div>
        </div>
    }

    const FinalPrompt = () => {
        if (!importResult.current || !selectedAccount.current) return null;

        const applyImport = () => {
            triggerNextStep('importing');
        }

        const transactionCount = importResult.current.importedTransactions.length;
        const newTransactionCount = importResult.current.importedTransactions.filter(tx => tx.isNew).length;
        const existingTransactionCount = transactionCount - newTransactionCount;
        const selectedAccountBank = ImportMatrix.Banks[selectedAccount.current.bankId] ?? undefined;
        const selectedAccountOffering = selectedAccountBank?.offerings?.find(o => o.id === selectedAccount.current?.offeringId);

        return (<>
            <Item variant="outline">
                <ItemMedia variant="image">
                    <ImportIconComponent name={selectedAccountBank?.display?.icon} />
                </ItemMedia>
                <ItemContent>
                    <div className="flex flex-row justify-between w-full">
                        <div>
                            <ItemTitle>
                                {selectedAccountBank?.display?.name && <span className="uppercase">{selectedAccountBank?.display?.name}</span>}
                            </ItemTitle>
                            <ItemDescription className="flex justify-between">
                                {selectedAccountOffering?.display?.name && <span className="text-sm text-muted-foreground">{selectedAccountOffering?.display?.name}</span>}
                            </ItemDescription>
                        </div>
                        <span className="text-xl"><AccountNumber accountNumber={selectedAccount.current?.accountNumber} /></span>
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

    const Imported = () => {
        return <div>Import complete!</div>
    }

    const ErrorPrompt = () => {
        if (!importError.current) return null;
        return <div className="text-destructive">Error: {importError.current.message}</div>;
    }

    if (files.length === 0 || files.length > 1) return null;

    return <>
        {files.map(file => <Item key={file.name}>
            <ItemMedia variant="image">
                {fileIcon(file, 'shrink-0')}
            </ItemMedia>
            <ItemContent className="w-36">
                <ItemTitle className="w-full"><span className="truncate">{file.name}</span></ItemTitle>
                <ItemDescription><FileSize file={file} /></ItemDescription>
            </ItemContent>
            <ItemActions>
                {statusIcon(status.current, 'shrink-0')}
            </ItemActions>
        </Item>)}
        {status.current === 'passwordPrompt' && <PasswordPrompt />}
        {status.current === 'adapterPrompt' && <AdapterPrompt />}
        {status.current === 'accountPrompt' && <AccountPrompt />}
        {status.current === 'finalPrompt' && <FinalPrompt />}
        {status.current === 'imported' && <Imported />}
        {status.current === 'error' && <ErrorPrompt />}
    </>;

}

export default ImportPage;
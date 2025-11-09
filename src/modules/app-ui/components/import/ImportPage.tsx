import type { MoneyAccount } from "@/modules/app/entities/MoneyAccount";
import type { IFileImportAdapter } from "@/modules/app/import/interfaces/IFileImportAdapter";
import { ImportError, ImportService, type ImportResult } from "@/modules/app/services/ImportService";
import { Button } from "@/modules/base-ui/components/ui/button";
import { Input } from "@/modules/base-ui/components/ui/input";
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/modules/base-ui/components/ui/item";
import { Clock, File, FileText, Hourglass, SquareCheck, SquareX } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type JSX } from "react";
import FileSize from "../../common/FileSize";
import ImportIcon from "../../icons/import/ImportIcon";

type ImportPageProps = {
    files: File[];
    close: () => void;
}

type ImportStatus = 'pending' | 'importing' | 'imported' | 'error';

const ImportPage: React.FC<ImportPageProps> = ({ files, close }: ImportPageProps) => {

    const statusIcon = (status: ImportStatus, className?: string): JSX.Element => {
        switch (status) {
            case 'pending':
                return <Clock className={`scale-150 ${className}`} />;
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
        return <File className={`scale-150 ${className}`} />;
    }

    const bankLogo = (name: string, props?: React.SVGProps<SVGSVGElement>): JSX.Element | null => {
        const LogoComponent = ImportIcon[name as keyof typeof ImportIcon];
        return LogoComponent ? <LogoComponent {...props} /> : null;
    }

    const adapter = (account: MoneyAccount): IFileImportAdapter | undefined => {
        return serviceRef.current.getAdapterData(account);
    }

    const [status, setStatus] = useState<ImportStatus>('pending');
    const [importError, setImportError] = useState<ImportError | null>(null);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [selectedAdapter, setSelectedAdapter] = useState<IFileImportAdapter | undefined>(undefined);
    const [password, setPassword] = useState("");

    const serviceRef = useRef(new ImportService());

    const runImport = useCallback(async () => {
        if (files.length !== 1) {
            setImportError(new ImportError('IMPORT_FAILED', 'Only one file can be imported at a time.'));
            setStatus('error');
            return;
        }

        setStatus('importing');
        setImportError(null);

        try {
            const result = await serviceRef.current.import(files[0], selectedAdapter);
            setImportResult(result);
            setStatus('imported');
        } catch (error) {
            if (error instanceof ImportError) setImportError(error);
            else setImportError(new ImportError('IMPORT_FAILED', (error as Error).message));
            setStatus('error');
            return;
        }
    }, [files, selectedAdapter]);

    useEffect(() => {
        runImport();
    }, [runImport]);

    const setAdapter = (adapter: IFileImportAdapter) => {
        setSelectedAdapter(adapter)
        setTimeout(() => {
            runImport();
        }, 0);
    }

    const setAccount = (account: MoneyAccount) => {
        if (!importResult) return;
        setImportResult((importResult) => {
            importResult!.importedAccounts = [account];
            return importResult;
        })
    }

    const addPassword = () => {
        if (selectedAdapter) {
            serviceRef.current.addPassword(selectedAdapter, password);
        } else if (importError && importError.adapters && importError.adapters.length === 1) {
            serviceRef.current.addPassword(importError.adapters[0], password);
        }
    }

    const applyImport = () => {
        if (!importResult) return;
        serviceRef.current.apply(importResult);
        close();
    }

    const importSummary = (importResult: ImportResult) => {
        const transactionCount = importResult.importedTransactions.length;
        const newTransactionCount = importResult.importedTransactions.filter(tx => tx.isNew).length;
        const existingTransactionCount = transactionCount - newTransactionCount;

        return (<>
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

    if (importError && importError.type === 'MULTIPLE_ADAPTERS') {
        return <div>
            <div className="text-lg">Select account</div>
            <div className="text-sm text-muted-foreground">Multiple accounts detected. Choose one to continue.</div>
            <div className="flex flex-col gap-2 mt-2">
                {importError.adapters?.map(a =>
                    <Item key={a.name} variant="outline" className="hover:bg-muted cursor-pointer" onClick={() => setAdapter(a)}>
                        <ItemMedia variant="image">
                            {bankLogo(a.display.icon)}
                        </ItemMedia>
                        <ItemContent>
                            <ItemTitle>{a.display.bankName}</ItemTitle>
                            <ItemDescription>{a.display.type}</ItemDescription>
                        </ItemContent>
                    </Item>)}
            </div>
        </div>
    }

    if (importError && importError.type === 'PASSWORD_REQUIRED') {
        return <div>
            <div className="text-lg">Password Required</div>
            <div className="text-sm text-muted-foreground">The file appears to be password protected. Enter password to retry.</div>
            <div className="flex flex-col gap-2 mt-2">
                <Input type="password" placeholder="password" value={password} onChange={e => setPassword(e.target.value)} />
                <Button disabled={!password} onClick={() => addPassword()}>Import</Button>
            </div>
        </div>;
    }

    if (importResult && importResult.importedAccounts.length > 1) {
        return <div>
            <div className="text-lg">Select account type</div>
            <div className="text-sm text-muted-foreground">Multiple account types detected. Choose one to continue.</div>
            <div className="flex flex-col gap-2 mt-2">
                {importResult.importedAccounts.map(account => (
                    [adapter(account)].filter(a => a !== undefined).map(adapter =>
                        <Item key={`${adapter.name}-${account.id}`} variant="outline" className="hover:bg-muted cursor-pointer" onClick={() => setAccount(account)}>
                            <ItemMedia variant="image">
                                {bankLogo(adapter.display.icon)}
                            </ItemMedia>
                            <ItemContent>
                                <ItemTitle>{adapter.name}</ItemTitle>
                                <ItemDescription>{account.accountNumber}</ItemDescription>
                            </ItemContent>
                        </Item>
                    )
                ))}
            </div>
        </div>
    }

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
                {statusIcon(status, 'shrink-0')}
            </ItemActions>
        </Item>)}
        {importError && <div className="text-destructive">Error: {importError.message}</div>}
        {importResult && importSummary(importResult)}
    </>;

}

export default ImportPage;
import FileSize from "@/modules/app-ui/common/FileSize";
import { useImport } from "@/modules/app-ui/components/import/ImportProvider";
import { ImportIconComponent } from "@/modules/app-ui/icons/import/ImportIcon";
import { Button } from "@/modules/base-ui/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/modules/base-ui/components/ui/input-group";
import { Label } from "@/modules/base-ui/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/modules/base-ui/components/ui/table";
import { FileImportProcessContext } from "@/modules/import/context/FileImportProcessContext";
import type { ImportProcessStatus } from "@/modules/import/context/ImportProcessContext";
import { AdapterSelectionError, FilePasswordError, PromptError, type PromptErrorType } from "@/modules/import/errors/PromptError";
import { ImportMatrix } from "@/modules/import/ImportMatrix";
import type { IImportAdapter } from "@/modules/import/interfaces/IImportAdapter";
import { Asterisk, FileText, Trash } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const DevImportPage: React.FC = () => {

    const { enabled, setEnabled } = useImport();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const context = useRef<FileImportProcessContext | null>(null);
    const [status, setStatus] = useState<ImportProcessStatus>('pending');
    const [file, setFile] = useState<File | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [password, setPassword] = useState<string>('');
    const [passwordError, setPasswordError] = useState<string | null>(null);

    useEffect(() => {
        setEnabled(false);
        return () => setEnabled(true);
    }, [setEnabled]);

    const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setFile(e.dataTransfer.files[0]);
            e.dataTransfer.clearData();
        }
    };

    useEffect(() => {
        if (!file) return;
        if (context.current) {
            if (context.current.file === file) return;
            else context.current.cancel();
        }

        const newContext = new FileImportProcessContext(file);
        context.current = newContext;
        const subscription = context.current.observeStatus().subscribe(setStatus);
        newContext.startOrResume();

        return () => subscription.unsubscribe();

    }, [file]);

    const getPromptError = <T extends PromptError>(type: PromptErrorType): T | null => {
        if (!context.current) return null;
        const error = context.current.error;
        if (!error || !(error instanceof PromptError) || error.errorType !== type) return null;
        return error as T;
    }

    const resolvePasswordPrompt = async (password: string) => {
        const error = getPromptError<FilePasswordError>('file_password');
        if (!error) return;
        const valid = await error.tryAndStorePassword(password);
        if (!valid) {
            setPasswordError("Incorrect password, please try again.");
            return;
        }
    }

    const resolveAdapterSelection = (adapter: IImportAdapter) => {
        const error = getPromptError<AdapterSelectionError>('adapter_selection');
        if (!error) return;
        error.selectAdapter(adapter);
    }

    const bank = (adapter: IImportAdapter | null) => {
        if (!adapter) return null;
        const [bank,] = ImportMatrix.AdapterBankData[adapter.id];
        return bank;
    }

    const offering = (adapter: IImportAdapter | null) => {
        if (!adapter) return null;
        const [, offering] = ImportMatrix.AdapterBankData[adapter.id];
        return offering;
    }

    return <div className="flex flex-col items-center gap-2 m-4 min-w-0">
        <div className="self-end">Global import handler: {enabled ? "Enabled" : "Disabled"}</div>

        {!file && <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleFileDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
            className="p-12 max-w-96 border-2 border-dashed border-muted-foreground bg-muted/50 rounded-md">
            <label className="cursor-pointer">
                <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} />
                <div className="text-center text-muted-foreground">
                    {isDragOver ? `Release to drop the file` : `Click to select a file to import`}
                </div>
            </label>
        </div>}

        {file && <div className="flex flex-row gap-4 items-center max-w-[calc(100%-2rem)] border p-4 rounded-md">
            <FileText className="size-12" />
            <div className="flex flex-col flex-1 min-w-0">
                <span className="font-semibold truncate">{file.name}</span>
                <span className="text-sm text-muted-foreground">{file.type || 'N/A'}</span>
                <span className="text-sm text-muted-foreground"><FileSize file={file} /></span>
                <span className="">{status}: {context.current?.error && context.current.error.message}</span>
            </div>
            <Button variant="outline" size="icon" onClick={() => setFile(null)}>
                <Trash />
            </Button>
        </div>
        }

        {context.current && context.current.error && context.current.error instanceof PromptError && <>

            {context.current.error.errorType === 'file_password' && <>
                <InputGroup className="max-w-96">
                    <InputGroupAddon><Asterisk /></InputGroupAddon>
                    <InputGroupInput placeholder="Enter password to continue" value={password} onChange={(e) => setPassword(e.target.value)} />
                </InputGroup>
                {passwordError && <Label className="text-sm text-destructive mt-1">{passwordError}</Label>}
                <Button variant="outline" onClick={() => resolvePasswordPrompt(password)}>Submit</Button>
            </>}

            {context.current.error.errorType === 'adapter_selection' && <>
                <div className="mt-4">Click on the adapter icon to import</div>
                <div className="flex flex-row flex-wrap gap-2 mb-4">
                    {(context.current.error as AdapterSelectionError).adapterIds.map(id => ImportMatrix.Adapters[id]).map(adapter => <Button
                        key={adapter.id} size="lg" className="h-14"
                        onClick={() => resolveAdapterSelection(adapter)}>
                        <div className="flex flex-row gap-2 items-center">
                            <ImportIconComponent name={bank(adapter)?.display?.icon ?? ''} className="size-7" />
                            <div className="flex flex-col items-start">
                                <span className="font-semibold uppercase">{bank(adapter)?.display?.name}</span>
                                <span className="text-sm">{offering(adapter)?.display?.name}</span>
                            </div>
                        </div>
                    </Button>)}
                </div>
            </>}

            {context.current.error.errorType === 'require_confirmation' && <>
                <div className="mt-4 self-start">Import Data:</div>
                <div className="flex flex-col gap-2 items-start w-full">
                    <table className="w-full max-w-md">
                        <tbody>
                            {Object.entries(context.current.data?.account ?? {}).map(([key, values]) => (
                                <tr key={key}>
                                    <td className="font-semibold pr-4 align-top">{key}:</td>
                                    <td>{values.join(', ')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="w-full overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {context.current.data?.transactions.map((tx, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{tx.date.toDateString()}</TableCell>
                                        <TableCell className="whitespace-normal">{tx.description}</TableCell>
                                        <TableCell>{tx.amount.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </>}

        </>}
    </div>
}

export default DevImportPage;
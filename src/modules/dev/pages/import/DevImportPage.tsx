import FileSize from "@/modules/app-ui/common/FileSize";
import { useImport } from "@/modules/app-ui/components/import/ImportProvider";
import { ImportIconComponent } from "@/modules/app-ui/icons/import/ImportIcon";
import { ImportMatrix } from "@/modules/app/import/ImportMatrix";
import type { IFile, IFileImportAdapter } from "@/modules/app/import/interfaces/IFileImportAdapter";
import type { ImportData } from "@/modules/app/import/interfaces/ImportData";
import { ImportService } from "@/modules/app/services/ImportService";
import { Button } from "@/modules/base-ui/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/modules/base-ui/components/ui/input-group";
import { Spinner } from "@/modules/base-ui/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/modules/base-ui/components/ui/table";
import { Asterisk, Check, FileText, Trash, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const DevImportPage: React.FC = () => {

    const { enabled, setEnabled } = useImport();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const service = useRef(new ImportService());
    const [file, setFile] = useState<File | null>(null);
    const [openFile, setOpenFile] = useState<IFile | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [supportedAdapters, setSupportedAdapters] = useState<IFileImportAdapter<any>[]>([]);
    const [selectedAdapter, setSelectedAdapter] = useState<IFileImportAdapter<any> | null>(null);
    const [password, setPassword] = useState<string>('');
    const [supported, setSupported] = useState<boolean | null>(null);
    const [importData, setImportData] = useState<ImportData | null>(null);
    const [importError, setImportError] = useState<Error | null>(null);

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
        (async () => {
            const openFile = await service.current.readFile(file, password);
            if (!openFile) {
                setImportError(new Error('Unable to open file'));
            } else if ('message' in openFile) {
                setImportError(new Error(openFile.message));
            } else {
                setOpenFile(openFile);
                const adapters = service.current.getSupportedFileAdapters(openFile);
                setSupportedAdapters(adapters);
            }
        })();
    }, [file, password]);

    useEffect(() => {
        if (!openFile || !selectedAdapter) return;
        setSupported(selectedAdapter.isSupported(openFile));
    }, [openFile, selectedAdapter]);

    useEffect(() => {
        if (!selectedAdapter || !openFile || !supported) return;

        setImportData(null);
        setImportError(null);

        selectedAdapter.read(openFile)
            .then(result => setImportData(result))
            .catch(err => setImportError(err));

    }, [selectedAdapter, openFile, supported]);

    const supportedAdapterMeta = supportedAdapters.map(adapter => {
        const [bank, offering] = ImportMatrix.AdapterBankData[adapter.id]
        return { adapter, bank, offering };
    })

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

        {file && <>
            <div className="flex flex-row gap-4 items-center max-w-[calc(100%-2rem)] border p-4 rounded-md">
                <FileText className="size-12" />
                <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-semibold truncate">{file.name}</span>
                    <span className="text-sm text-muted-foreground">{file.type || 'N/A'}</span>
                    <span className="text-sm text-muted-foreground"><FileSize file={file} /></span>
                </div>
                <Button variant="outline" size="icon" onClick={() => setFile(null)}>
                    <Trash />
                </Button>
            </div>
            <InputGroup className="max-w-96">
                <InputGroupAddon><Asterisk /></InputGroupAddon>
                <InputGroupInput placeholder="Password (if any)" value={password} onChange={(e) => setPassword(e.target.value)} />
            </InputGroup>
            <div className="mt-4">Click on the adapter icon to import</div>
            <div className="flex flex-row flex-wrap gap-2 mb-4">
                {Object.values(supportedAdapterMeta).map(({ adapter, bank, offering }) => <Button
                    key={adapter.id} size="lg" className="h-14"
                    variant={selectedAdapter?.id === adapter.id ? 'secondary' : 'outline'}
                    onClick={() => selectedAdapter ? setSelectedAdapter(null) : setSelectedAdapter(adapter)}>
                    <div className="flex flex-row gap-2 items-center">
                        <ImportIconComponent name={bank?.display?.icon ?? ''} className="size-7" />
                        <div className="flex flex-col items-start">
                            <span className="font-semibold uppercase">{bank?.display?.name}</span>
                            <span className="text-sm">{offering?.display?.name}</span>
                        </div>
                    </div>
                </Button>)}
            </div>
        </>}

        {selectedAdapter && <>
            {supported === null ?
                <Spinner /> :
                <div className="flex flex-row items-center gap-2">
                    <span className="text-xl">Supported: </span>
                    {supported ? <Check className="size-8" /> : <X className="text-destructive size-8" />}
                </div>
            }

            {importData && <>
                <div className="mt-4 self-start">Import Data:</div>
                <div className="flex flex-col gap-2 items-start w-full">
                    <span className="text-xl">Account no: {importData.identifiers.join(', ')}</span>
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
                                {importData.transactions.map((tx, index) => (
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

            {importError && <>
                <div className="mt-4 self-start">Import Error:</div>
                <pre className="p-4 self-start border rounded-md bg-muted/50 text-destructive">
                    {String(importError)}
                </pre>
            </>}
        </>}
    </div>
}

export default DevImportPage;
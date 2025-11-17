import FileSize from "@/modules/app-ui/common/FileSize";
import { useImport } from "@/modules/app-ui/components/import/ImportProvider";
import ImportIcon from "@/modules/app-ui/icons/import/ImportIcon";
import { ImportHandler } from "@/modules/app/import/ImportHandler";
import type { IFileImportAdapter } from "@/modules/app/import/interfaces/IFileImportAdapter";
import type { IImportAdapter } from "@/modules/app/import/interfaces/IImportAdapter";
import type { ImportData } from "@/modules/app/import/interfaces/ImportData";
import type { ImportError } from "@/modules/app/services/ImportService";
import { Button } from "@/modules/base-ui/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/modules/base-ui/components/ui/input-group";
import { Spinner } from "@/modules/base-ui/components/ui/spinner";
import { Asterisk, Check, FileText, Trash, X } from "lucide-react";
import { useEffect, useState } from "react";

const DevImportPage: React.FC = () => {

    const { enabled, setEnabled } = useImport();
    const [file, setFile] = useState<File | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [supportedAdapters, setSupportedAdapters] = useState<IFileImportAdapter[]>([]);
    const [selectedAdapter, setSelectedAdapter] = useState<IFileImportAdapter | null>(null);
    const [password, setPassword] = useState<string>('');
    const [supported, setSupported] = useState<boolean | null>(null);
    const [importData, setImportData] = useState<ImportData | null>(null);
    const [importError, setImportError] = useState<ImportError | null>(null);

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
        const adapters = ImportHandler.getSupportedFileAdapters(file);
        setSupportedAdapters(adapters);
    }, [file]);

    useEffect(() => {
        if (!selectedAdapter || !file) return;
        setImportData(null);
        setImportError(null);
        selectedAdapter.isFileSupported(file, password ? [password] : [])
            .then(isSupported => {
                setSupported(isSupported);
                if (!isSupported) return;
                selectedAdapter.readFile(file, password ? [password] : [])
                    .then(result => setImportData(result))
                    .catch(err => setImportError(err));
            });
    }, [selectedAdapter, file, password]);

    const AdapterIcon = (adapter: IImportAdapter) => {
        const IconComponent = ImportIcon[adapter.display.icon];
        if (!IconComponent) return null;
        return <IconComponent className="size-8" />;
    }

    return <div className="flex flex-col items-center gap-2">
        <div className="self-end">Global import handler: {enabled ? "Enabled" : "Disabled"}</div>

        {!file && <div
            onDrop={handleFileDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
            className={`p-12 max-w-96 border-2 border-dashed border-muted-foreground bg-muted/50 rounded-md`}>
            <label className="cursor-pointer">
                <div className="text-center text-muted-foreground">
                    {isDragOver ? `Release to drop the file` : `Click to select a file to import`}
                </div>
            </label>
        </div>}

        {file && <>
            <div className="flex flex-row gap-4 items-center border p-4 rounded-md">
                <FileText className="size-12" />
                <div className="flex flex-col">
                    <span className="font-semibold">{file.name}</span>
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
            <div className="flex flex-row gap-2 mb-4">
                {Object.values(supportedAdapters).map(adapter => <Button
                    key={adapter.name}
                    variant={selectedAdapter?.name === adapter.name ? 'outline' : 'ghost'}
                    onClick={() => selectedAdapter ? setSelectedAdapter(null) : setSelectedAdapter(adapter)}>
                    {AdapterIcon(adapter)}
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
                <pre className="p-4 border rounded-md bg-muted/50">
                    {JSON.stringify(importData, null, 2)}
                </pre>
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
import { ImportIcon } from "lucide-react";
import { useRef } from "react";
import { useImport } from "../import/ImportProvider";
import BaseWidget from "./BaseWidget";

const ImportComponent: React.FC = () => {

    const { importFiles } = useImport();
    const inputRef = useRef<HTMLInputElement>(null);

    const onFileSelect = () => {
        const files = inputRef.current?.files;
        if (files && files.length > 0) {
            importFiles(Array.from(files));
        }
        if (inputRef.current) {
            inputRef.current.value = "";
        }
    }

    return <div
        className="w-48 h-20 rounded-lg flex flex-row items-center justify-center gap-4 cursor-pointer hover:bg-muted/50"
        onClick={() => inputRef.current?.click()}>
        <ImportIcon className="size-10" />
        <div className="flex flex-col items-center gap-1">
            <span>Import</span>
            <span>Transactions</span>
        </div>
        <input type="file" ref={inputRef} className="hidden" onChange={onFileSelect} />
    </div>;
}

const ImportWidget: React.FC = () => {
    return <BaseWidget
        WidgetComponent={ImportComponent}
        WidgetSettings={() => <div>settings</div>}
        resizeable={true} size={{
            default: { width: 12, height: 5 },
            min: { width: 12, height: 5 }
        }}
    />;
}

export default ImportWidget;
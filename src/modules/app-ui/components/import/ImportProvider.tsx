import { Dialog, DialogContent, DialogTitle } from "@/modules/base-ui/components/ui/dialog";
import { useDataSync } from "@/modules/data-sync/providers/DataSyncProvider";
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from "react";
import Dropzone from "./Dropzone";
import ImportComponent from "./ImportComponent";

interface ImportContextProps {
    importFiles: (file: File[]) => Promise<void>;
    status: 'idle' | 'importing';
    enabled: boolean;
    setEnabled: (enabled: boolean) => void;
}

const ImportContext = createContext<ImportContextProps | undefined>(undefined);

export const ImportProvider: React.FC<PropsWithChildren> = ({ children }: PropsWithChildren) => {

    const { orchestrator } = useDataSync();
    const [showImportModal, setShowImportModal] = useState<boolean>(false);
    const [enabled, setEnabled] = useState<boolean>(false);
    const [files, setFiles] = useState<File[]>([]);

    const importFiles = async (files: File[]) => {
        setFiles(files);
        setShowImportModal(true);
    };

    useEffect(() => {
        if (orchestrator) {
            setEnabled(true);
        } else {
            setEnabled(false);
        }
    }, [orchestrator]);

    return (
        <ImportContext.Provider value={{
            importFiles,
            status: showImportModal ? 'importing' : 'idle',
            enabled, setEnabled
        }}>
            {children}
            {enabled && !showImportModal && <Dropzone onFileDrop={importFiles} maxFileCount={1} />}
            <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
                <DialogContent>
                    <DialogTitle>Import Files</DialogTitle>
                    <ImportComponent files={files} close={() => setShowImportModal(false)} />
                </DialogContent>
            </Dialog>
        </ImportContext.Provider >
    );
};

export const useImport = (): ImportContextProps => {
    const context = useContext(ImportContext);
    if (!context) {
        throw new Error("useImport must be used within an ImportProvider");
    }
    return context;
};
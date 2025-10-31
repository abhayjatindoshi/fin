import { Dialog, DialogContent, DialogTitle } from "@/modules/base-ui/components/ui/dialog";
import { createContext, useState, type PropsWithChildren } from "react";
import Dropzone from "./Dropzone";
import ImportPage from "./ImportPage";

interface ImportContextProps {
    import: (file: File[]) => Promise<void>;
    status: 'idle' | 'importing';
}

const ImportContext = createContext<ImportContextProps | undefined>(undefined);

export const ImportProvider: React.FC<PropsWithChildren> = ({ children }: PropsWithChildren) => {
    const [showImportModal, setShowImportModal] = useState<boolean>(false);
    const [files, setFiles] = useState<File[]>([]);

    const importFiles = async (files: File[]) => {
        setFiles(files);
        setShowImportModal(true);
    };

    return (
        <ImportContext.Provider value={{ import: importFiles, status: showImportModal ? 'importing' : 'idle' }}>
            {children}
            {!showImportModal && <Dropzone onFileDrop={importFiles} maxFileCount={1} />}
            <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
                <DialogContent>
                    <DialogTitle>Import Files</DialogTitle>
                    <ImportPage files={files} close={() => setShowImportModal(false)} />
                </DialogContent>
            </Dialog>
        </ImportContext.Provider >
    );
};
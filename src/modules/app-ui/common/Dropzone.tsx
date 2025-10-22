import { Button } from "@/modules/base-ui/components/ui/button";
import { Card, CardContent } from "@/modules/base-ui/components/ui/card";
import { Portal } from "@radix-ui/react-portal";
import { Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Logo from "./Logo";

interface DropzoneProps {
    /** File types to accept (e.g., ['.json', '.csv', 'image/*']) */
    acceptedFileTypes?: string[];
    /** Optionally validate file types manually */
    isValid?: (file: File) => boolean;
    /** Callback when files are dropped */
    onFileDrop: (files: File[]) => void;
}

const Dropzone: React.FC<DropzoneProps> = ({
    acceptedFileTypes = [],
    isValid = () => true,
    onFileDrop
}: DropzoneProps) => {

    const [isDragOver, setIsDragOver] = useState(false);
    const dragCounterRef = useRef(0);

    const validateFiles = (files: FileList | undefined): File[] => {
        if (!files) return []
        const validFiles = Array.from(files)
            // filter files
            .filter(file => acceptedFileTypes?.some(type => {
                if (type.startsWith('.')) return file.name.toLowerCase().endsWith(type.toLowerCase());
                else if (type.includes('*')) {
                    const baseType = type.split('/')[0];
                    return file.type.startsWith(baseType);
                } else return file.type == type;
            }))
            .filter(isValid)
        return validFiles;
    }

    const handleDragEnter = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Only show overlay if files are being dragged
        if (e.dataTransfer?.types.includes('Files')) {
            dragCounterRef.current++;
            setIsDragOver(true);
        }
    };

    const handleDragLeave = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        dragCounterRef.current--;

        if (dragCounterRef.current === 0) {
            setIsDragOver(false);
        }
    };

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Show copy cursor for valid files
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'copy';
        }
    };

    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Reset drag state
        dragCounterRef.current = 0;
        setIsDragOver(false);

        const files = e.dataTransfer?.files;
        const validFiles = validateFiles(files);

        if (onFileDrop && validFiles.length > 0) {
            onFileDrop(validFiles);
        }
    }

    useEffect(() => {
        // Attach listeners to window to catch all drag events
        window.addEventListener('dragenter', handleDragEnter);
        window.addEventListener('dragleave', handleDragLeave);
        window.addEventListener('dragover', handleDragOver);
        window.addEventListener('drop', handleDrop);

        return () => {
            window.removeEventListener('dragenter', handleDragEnter);
            window.removeEventListener('dragleave', handleDragLeave);
            window.removeEventListener('dragover', handleDragOver);
            window.removeEventListener('drop', handleDrop);
        };
    }, [onFileDrop, acceptedFileTypes, isValid]);

    if (!isDragOver) return null;

    return <Portal>
        <div className="fixed inset-0 z-50">
            <div className="w-full h-full p-8">
                <Button variant="outline" size="icon" className="float-end" onClick={() => setIsDragOver(false)}><X /></Button>
                <div className="w-full h-full flex flex-col items-center justify-end gap-5">
                    <div className="flex-1 flex items-center justify-center m-8 border-8 border-dashed rounded-3xl w-full bg-secondary/90">
                        Drop files here
                    </div>
                    <Card className="rounded-4xl p-5 border px-3 py-1 rounded-b-none bg-secondary/50 backdrop-blur">
                        <CardContent className="flex flex-row items-center">
                            <Upload className="scale-150 animate-bounce mr-7" />
                            <div className="flex flex-col">
                                <Logo size="small" />
                                Drop files to process them
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    </Portal>;
}

export default Dropzone;
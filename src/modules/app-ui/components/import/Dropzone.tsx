import { Button } from "@/modules/base-ui/components/ui/button";
import { Card, CardContent } from "@/modules/base-ui/components/ui/card";
import { Portal } from "@radix-ui/react-portal";
import { Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Logo from "../../common/Logo";

interface DropzoneProps {
    maxFileCount?: number;
    isValid?: (file: File[]) => string | null;
    onFileDrop: (files: File[]) => void;
}

const Dropzone: React.FC<DropzoneProps> = ({
    maxFileCount,
    isValid = () => null,
    onFileDrop
}: DropzoneProps) => {

    const [isDragOver, setIsDragOver] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const dragCounterRef = useRef(0);

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
        if (!files || files.length === 0) return;

        if (maxFileCount && files.length > maxFileCount) {
            setErrorMessage(`Only ${maxFileCount} file(s) allowed`);
            return;
        }

        if (isValid) {
            const validationError = isValid(Array.from(files));
            if (validationError) {
                setErrorMessage(validationError);
                return;
            }
        }

        if (onFileDrop) {
            onFileDrop(Array.from(files));
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
    }, [onFileDrop, isValid]);

    const reset = () => {
        setIsDragOver(false);
        setErrorMessage(null);
    }

    if (!isDragOver && !errorMessage) return null;

    return <Portal>
        <div className="fixed inset-0 z-50">
            <div className="w-full h-full py-5 px-8 backdrop-blur-sm">
                <Button variant="outline" size="icon" className="float-end" onClick={reset}><X /></Button>
                <div className="w-full h-full flex flex-col items-center justify-end">
                    <div className="grainy bg-background/10 flex-1 flex flex-col items-center justify-center m-3 border-8 border-dashed rounded-lg w-full">
                        {errorMessage && <span className="text-destructive">{errorMessage}</span>}
                        <span>Drop files here</span>
                    </div>
                    <Card className="rounded-4xl border rounded-b-none bg-secondary/50 backdrop-blur">
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
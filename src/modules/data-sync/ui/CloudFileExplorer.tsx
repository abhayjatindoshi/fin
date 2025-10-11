import EmptyOpenBox from "@/modules/base-ui/components/illustrations/EmptyOpenBox";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/modules/base-ui/components/ui/breadcrumb";
import { Button } from "@/modules/base-ui/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/modules/base-ui/components/ui/dialog";
import { Input } from "@/modules/base-ui/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/modules/base-ui/components/ui/popover";
import { Spinner } from "@/modules/base-ui/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/modules/base-ui/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/modules/base-ui/components/ui/tooltip";
import { cn } from "@/modules/base-ui/lib/utils";
import { CircleX, File, Folder, FolderPlus, Home, RefreshCw } from "lucide-react";
import moment from 'moment';
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import type { CloudFile, CloudSpace, ICloudFileService } from "../interfaces/ICloudFileService";

export interface CloudFileExplorerValidator {
    isSpaceEnabled: (space: CloudSpace) => boolean;
    isSpaceVisible: (space: CloudSpace) => boolean;
    isFileEnabled: (file: CloudFile) => boolean;
    isFileVisible: (file: CloudFile) => boolean;
    folderCreationEnabled: (space: CloudSpace, parentFolder: CloudFile | undefined) => boolean;
}

interface CloudFileExplorerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (space: CloudSpace, file: CloudFile) => void;
    service: ICloudFileService;
    validator?: CloudFileExplorerValidator
    title?: string;
    description?: string;
}

const CloudFileExplorer: React.FC<CloudFileExplorerProps> = ({
    open, onOpenChange, onSelect, service, validator, title, description
}: CloudFileExplorerProps): React.ReactElement => {

    const [spaces, setSpaces] = useState<Array<CloudSpace> | undefined>();
    const [currentSpace, setCurrentSpace] = useState<CloudSpace | undefined>();
    const [files, setFiles] = useState<Array<CloudFile> | undefined>();
    const [currentFolder, setCurrentFolder] = useState<CloudFile | undefined>();
    const [selected, setSelected] = useState<CloudFile | undefined>();
    const [history, setHistory] = useState<Array<CloudFile>>([]);
    const [search, setSearch] = useState<string | undefined>();
    const [loading, setLoading] = useState(false);
    const [newFolderName, setNewFolderName] = useState<string>('');
    const [newFolderCreationError, setNewFolderCreationError] = useState<string | undefined>(undefined);

    const reset = () => {
        setSpaces(undefined);
        setCurrentSpace(undefined);
        setFiles(undefined);
        setCurrentFolder(undefined);
        setHistory([]);
        setSearch(undefined);
    }

    // load spaces on mount
    useEffect(() => {
        if (!open) return;
        reset();
        service.getSpaces().then((spaces) => {
            const filteredSpaces = spaces.filter(space => validator?.isSpaceVisible(space) ?? true);
            setSpaces(filteredSpaces);
            setCurrentSpace(filteredSpaces.length > 0 ? filteredSpaces[0] : undefined);
        });
    }, [open, service, validator]);

    // load files
    const loadFiles = useCallback(async (
        space: CloudSpace, parentFolder: CloudFile | undefined, search: string | undefined
    ): Promise<void> => {
        setLoading(true);
        try {
            const parentFolderId = parentFolder?.isFolder ? parentFolder.id : undefined;
            const listing = await service.getListing(space, parentFolderId, search);
            const filteredFiles = listing
                .filter(file => validator?.isFileVisible(file) ?? true)
                .sort((a, b) => a.isFolder === b.isFolder ? a.name.localeCompare(b.name) : a.isFolder ? -1 : 1);
            setFiles(filteredFiles);
        } finally {
            setSelected(undefined);
            setLoading(false);
        }
    }, [service, validator]);

    // initial load
    useEffect(() => {
        if (!open || !currentSpace) return;
        loadFiles(currentSpace, currentFolder, search);
    }, [open, currentSpace, currentFolder, search, loadFiles]);

    const switchSpace = (space: CloudSpace) => {
        if (space.id === currentSpace?.id) return;
        setCurrentFolder(undefined);
        setHistory([]);
        setSearch(undefined);
        setSelected(undefined);
        setCurrentSpace(space);
    }

    // Double click was only supported in desktop, so we use single click to open folders
    // const selecteFolder = (file: CloudFile) => {
    //     if (validator?.isFileEnabled(file) === false) return;
    //     setSelected(file);
    // }

    const openFolder = (file: CloudFile) => {
        if (!file.isFolder) return;
        setCurrentFolder(file);
        setHistory((h) => [...h, file]);
        setSearch(undefined);
        setSelected(undefined);
        void loadFiles(currentSpace!, file, undefined);
    }

    const navigateUpTo = (folder: CloudFile | undefined) => {
        if (folder === undefined) {
            setHistory([]);
            setCurrentFolder(undefined);
        } else {
            const index = history.findIndex(f => f.id === folder.id);
            if (index === -1) return;
            const newHistory = history.slice(0, index + 1);
            setHistory(newHistory);
            setCurrentFolder(folder);
        }
        setSearch(undefined);
        setSelected(undefined);
        void loadFiles(currentSpace!, folder, undefined);
    }

    const commitSelection = () => {
        if (!currentSpace) return;
        const selectedFolder = selected ?? currentFolder;
        if (!selectedFolder) return;
        onSelect(currentSpace, selectedFolder);
        onOpenChange(false);
        reset();
    }

    const createFolder = async () => {
        if (!currentSpace || !newFolderName.trim()) return;
        try {
            setLoading(true);
            setNewFolderCreationError(undefined);
            await service.createFolder(currentSpace, newFolderName.trim(), currentFolder?.id);
            await loadFiles(currentSpace, currentFolder, search);
            setNewFolderName('');
        } catch (e: Error | unknown) {
            if (e instanceof Error) {
                setNewFolderCreationError(e.message);
            } else {
                setNewFolderCreationError('Failed to create folder');
            }
        } finally {
            setLoading(false);
        }
    }

    return <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{title || 'Select Folder'}</DialogTitle>
                <DialogDescription>
                    {description || 'Select a folder from your cloud storage'}
                </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-2 max-h-[60vh]">
                <Tabs value={currentSpace?.id}>
                    <TabsList>{spaces?.map(space => (
                        <TabsTrigger value={space.id} key={space.id}
                            onClick={() => switchSpace(space)}
                            disabled={loading || validator?.isSpaceEnabled(space) === false} >
                            {space.displayName}
                        </TabsTrigger>
                    ))}
                    </TabsList>
                </Tabs>

                <div className="flex flex-row gap-2 items-center">
                    <Breadcrumb className="flex-1">
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild onClick={() => navigateUpTo(undefined)}>
                                    <span className="flex flex-row gap-1 items-center">
                                        <Home /> Home
                                    </span>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            {history.map((folder) => (
                                <>
                                    <BreadcrumbSeparator key={`sep-${folder.id}`} />
                                    <BreadcrumbItem key={folder.id}>
                                        <BreadcrumbLink asChild onClick={() => navigateUpTo(folder)}>
                                            <span className="flex flex-row gap-1 items-center">
                                                <Folder /> {folder.name}
                                            </span>
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                </>
                            ))}
                        </BreadcrumbList>
                    </Breadcrumb>
                    {currentSpace && <Button variant="ghost" onClick={() => void loadFiles(currentSpace, currentFolder, search)}>
                        <RefreshCw className={loading ? "animate-spin" : ""} />
                    </Button>}
                </div>

                <div className="relative overflow-auto rounded-md border min-h-60">
                    {loading &&
                        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm z-10">
                            <Spinner />
                        </div>}
                    {!loading && files?.length === 0 &&
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            <EmptyOpenBox className="mx-auto opacity-50 [&>svg]:size-12" animated={false} />
                            <div>No files or folders found</div>
                        </div>}
                    <ul className="divide-y divide-border/60">
                        {files?.map(file => {
                            const isSelected = selected?.id === file.id;
                            const disabled = validator?.isFileEnabled(file) === false;
                            return <li key={file.id}
                                onClick={() => openFolder(file)}
                                // onClick={() => selectFolder(file)}
                                // onDoubleClick={() => openFolder(file)}
                                className={cn(
                                    isSelected && 'bg-accent',
                                    disabled ? 'text-muted-foreground cursor-not-allowed' : 'cursor-pointer hover:bg-muted',
                                    'flex flex-row items-center gap-2 px-4 py-2 text-sm [&>svg]:size-4 w-full'
                                )}>
                                {file.isFolder ? <Folder /> : <File />}
                                <span className="truncate max-w-40" title={file.name}>{file.name}</span>
                                <div className="flex-1" />
                                {file.modifiedTime && <span>{moment(file.modifiedTime).fromNow()}</span>}
                            </li>
                        })}
                    </ul>
                </div>
            </div>
            <DialogFooter>
                <div className="flex gap-2 flex-1 justify-between">
                    {currentSpace && <Popover>
                        <PopoverTrigger asChild>
                            <Button className="justify-self-start" variant="secondary"
                                disabled={!validator?.folderCreationEnabled(currentSpace, currentFolder)}>
                                <FolderPlus /> New Folder
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent>
                            <div className="flex flex-row gap-2">
                                <Input type="text" placeholder="Name..." value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} autoFocus />
                                <Button disabled={loading} onClick={createFolder}>
                                    Create
                                    {loading && <Spinner />}
                                    {!loading && newFolderCreationError &&
                                        <Tooltip>
                                            <TooltipTrigger><CircleX className="text-destructive" /></TooltipTrigger>
                                            <TooltipContent>{newFolderCreationError}</TooltipContent>
                                        </Tooltip>}
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>}

                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button disabled={!selected && history.length === 0} onClick={commitSelection}>Select</Button>
                    </div>
                </div>
            </DialogFooter>
        </DialogContent>
    </Dialog>;
}

export default CloudFileExplorer;
import type { Household } from "@/modules/app/entities/Household";
import { Button } from "@/modules/base-ui/components/ui/button";
import { Checkbox } from "@/modules/base-ui/components/ui/checkbox";
import type { TenantFormProps } from "@/modules/data-sync/interfaces/IPersistence";
import { useEffect, useState } from "react";
import CloudFileExplorer from "../../../../data-sync/ui/CloudFileExplorer";
import { GoogleDriveFileService } from "./GoogleDriveFileService";

const GoogleDriveFolderSelectionStep: React.FC<TenantFormProps<Household>> = ({ tenant: household, setTenant: setHousehold, validateRef }: TenantFormProps<Household>) => {

    const [folderDialogOpen, setFolderDialogOpen] = useState(false);

    useEffect(() => {
        setHousehold({
            ...household,
            spaceId: appDataFolder,
        });
    }, []);

    useEffect(() => {
        validateRef.current.validate = async () => {
            return true;
        }
    }, [household, validateRef]);

    const appDataFolder = 'appDataFolder';

    const markShareable = (shareable: boolean) => {
        if (shareable) {
            setHousehold({
                ...household,
                spaceId: undefined,
            })
        } else {
            setHousehold({
                ...household,
                spaceId: appDataFolder,
            })
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Sharing</label>
                <label className="text-sm flex items-center gap-2 select-none cursor-pointer">
                    <Checkbox
                        checked={household.spaceId !== appDataFolder}
                        onCheckedChange={markShareable}
                        aria-label="Share household"
                    />
                    <span>Enable sharing with other users</span>
                </label>
                <p className="text-xs text-muted-foreground">
                    When sharing is enabled you can invite collaborators (future feature).
                </p>
            </div>

            {household.spaceId !== appDataFolder && (
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Folder (Drive)</label>
                    <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0 rounded-md border border-input bg-background dark:bg-input/30 px-3 py-2 text-sm h-10 flex items-center">
                            {household.folderId && household.folderName ? (
                                <span className="truncate" title={household.folderId}>{household.folderName}</span>
                            ) : (
                                <span className="text-muted-foreground">No folder selected</span>
                            )}
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setFolderDialogOpen(true)}>
                            {household.folderId ? 'Change' : 'Select'}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Choose a Google Drive folder for storing app data.
                    </p>
                </div>
            )}

            <CloudFileExplorer
                title="Open Household"
                description="Select a Google Drive folder to use as a household."
                open={folderDialogOpen}
                onOpenChange={setFolderDialogOpen}
                service={GoogleDriveFileService.getInstance()}
                validator={{
                    isFileEnabled: (file) => file.isFolder,
                    isSpaceEnabled: () => true,
                    isSpaceVisible: (space) => space.id !== 'appDataFolder',
                    isFileVisible: () => true,
                    folderCreationEnabled: (space, folder) => space.id === 'drive' || (space.id === 'sharedWithMe' && !!folder),
                }}
                onSelect={(space, folder) => {
                    setHousehold({ ...household, spaceId: space.id, folderId: folder.id, folderName: folder.name });
                    setFolderDialogOpen(false);
                }}
            />
        </div>
    );
};

export default GoogleDriveFolderSelectionStep;
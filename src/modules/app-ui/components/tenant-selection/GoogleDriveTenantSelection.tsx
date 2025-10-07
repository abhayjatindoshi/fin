import EmptyOpenBox from "@/modules/app-ui/svg/EmptyOpenBox";
import CloudFileExplorer from "@/modules/app/services/cloud/CloudFileExplorer";
import { GoogleDriveFileService } from "@/modules/app/services/cloud/google-drive/GoogleDriveFileService";
import { Button } from "@/modules/base-ui/components/ui/Button";
import { Spinner } from "@/modules/base-ui/components/ui/Spinner";
import { ChevronRight, ExternalLink, FolderOpen, Home, Plus } from "lucide-react";
import { nanoid } from "nanoid";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Config, Household } from "../../../app/services/cloud/types";
import { GoogleDriveNewTenantDialog } from "./GoogleDriveNewTenantDialog";

export const GoogleDriveTenantSelection: React.FC = () => {

    const [config, setConfig] = useState<Config | null>(null);
    const [newDialogOpen, setNewDialogOpen] = useState(false);
    const [folderDialogOpen, setFolderDialogOpen] = useState(false);

    useEffect(() => {
        GoogleDriveFileService.getInstance().getConfig().then(setConfig)
    }, [])

    const createHousehold = async (household: Household) => {
        const newConfig = config ? config : { households: [] };
        setConfig(null); // Show spinner while saving
        newConfig.households.push(household);
        await GoogleDriveFileService.getInstance().saveConfig(newConfig);
        setConfig({ ...newConfig });
    }

    return (
        <div className="flex flex-col gap-2 items-center w-full max-w-[400px] p-2">
            {!config ?
                <Spinner /> :
                <>
                    <div className="flex flex-row gap-5 mb-5">
                        <Button onClick={() => setNewDialogOpen(true)}><Plus /> New</Button>
                        <Button onClick={() => setFolderDialogOpen(true)}><FolderOpen /> Open</Button>
                    </div>
                    {config.households.length === 0 ?
                        <div className="flex flex-col gap-2 items-center">
                            <EmptyOpenBox animated={false} tone="accent" />
                            <p className="text-muted-foreground">No households found.</p>
                        </div> :
                        <div className="w-full">
                            {config.households.map(t => (
                                <Link key={t.id} to={`/${t.id}`}>
                                    <Button key={t.id} variant="outline" className="w-full h-16 m-1">
                                        <div key={t.id} className="flex flex-row gap-1 p-1 w-full items-center cursor-pointer">
                                            <Home />
                                            <div className="flex flex-row justify-start items-center gap-2 px-3 py-1 flex-1">
                                                <div className="text-lg font-medium truncate">{t.name}</div>
                                                <a href={`https://drive.google.com/drive/folders/${t.location?.folder?.id}`} target="_blank" rel="noopener noreferrer"><ExternalLink /></a>
                                            </div>
                                            <ChevronRight />
                                        </div>
                                    </Button>
                                </Link>
                            ))}
                        </div>
                    }
                </>
            }
            <GoogleDriveNewTenantDialog
                open={newDialogOpen}
                onOpenChange={setNewDialogOpen}
                onCreate={(data) => void createHousehold(data)}
            />
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
                    const household: Household = {
                        id: nanoid(5),
                        name: folder.name,
                        location: {
                            space: space,
                            folder: folder
                        }
                    }
                    createHousehold(household);
                }}
            />
        </div>
    )
}
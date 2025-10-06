import { Google } from "@/modules/app-ui/icons/Google";
import { GoogleDrive } from "@/modules/app-ui/icons/GoogleDrive";
import { GoogleDriveService } from "@/modules/app/services/cloud/google-drive/GoogleDriveService";
import type { Folder, Space } from "@/modules/app/services/cloud/types";
import { useAuth } from "@/modules/auth/AuthProvider";
import { LoginComponent } from "@/modules/auth/LoginComponent";
import { useTheme } from "@/modules/base-ui/components/theme-provider";
import { Button } from "@/modules/base-ui/components/ui/Button";
import { Spinner } from "@/modules/base-ui/components/ui/Spinner";
import { Home } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../common/Logo";

const Dashboard: React.FC = () => {
    const { theme, setTheme } = useTheme();
    const [isDarkTheme, setIsDarkTheme] = useState(theme === 'dark');
    const navigate = useNavigate();
    const auth = useAuth();
    const [spaces, setSpaces] = useState<Space[] | null>(null);
    const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
    const [folders, setFolders] = useState<Folder[] | null>(null);
    const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
    const [folderStack, setFolderStack] = useState<Folder[]>([]);

    const toggleTheme = () => {
        setTheme(isDarkTheme ? 'light' : 'dark');
        setIsDarkTheme(!isDarkTheme);
    }

    const loadSpaces = async () => {
        const drive = new GoogleDriveService(auth.token);
        const spaces = await drive.getSpaces();
        setSpaces(spaces);
    }

    const loadFolders = async (space: Space, search?: string, parentFolder?: Folder) => {
        const drive = new GoogleDriveService(auth.token);
        const folders = await drive.getFolders(space, search, parentFolder);
        setFolders(folders);
    }

    const selectSpace = async (space: Space) => {
        setSelectedSpace(space);
        setSelectedFolder(null);
        setFolders(null);
        const drive = new GoogleDriveService(auth.token);
        await drive.getFolders(space);
        await loadFolders(space, undefined, undefined);
    }

    const selectFolder = async (folder: Folder) => {
        if (!selectedSpace) return;
        setFolderStack(prev => [...prev, folder]);
        setFolders(null);
        setSelectedFolder(folder);
        await loadFolders(selectedSpace, undefined, folder);
    }

    const previousFolder = async () => {
        if (!selectedSpace || folderStack.length === 0) return;
        const newStack = [...folderStack];
        const parentFolder = newStack.length > 0 ? newStack.pop() : null;
        setFolderStack(newStack);
        setSelectedFolder(parentFolder ?? null);
        setFolders(null);
        await loadFolders(selectedSpace, undefined, parentFolder || undefined);
    }

    const createFolder = async () => {
        if (!selectedSpace) return;
        const folderName = prompt('Enter folder name:');
        if (!folderName) return;
        const drive = new GoogleDriveService(auth.token);
        const newFolder = await drive.createNewFolder(folderName, selectedSpace, selectedFolder || undefined);
        alert(`Folder created: ${newFolder.displayName}`);
        await loadFolders(selectedSpace, undefined, selectedFolder || undefined);
    }

    return (
        <div>
            <Logo size="small" />
            <h1>Welcome to the Dashboard</h1>
            <div className="flex flex-row gap-3">
                <Home /> <Google /> <GoogleDrive size={20} />
            </div>
            <div className="flex flex-row gap-3 flex-wrap">
                <p>This is a stub for the dashboard page.</p>
                <Button onClick={toggleTheme}>
                    {isDarkTheme ? 'Light Mode' : 'Dark Mode'}
                </Button>
                <div style={{ marginTop: 24 }}>
                    <Button onClick={() => navigate('/persistence-testing')}>
                        Go to Persistence Testing
                    </Button>
                </div>
                <div style={{ marginTop: 24 }}>
                    <Button onClick={() => navigate('/store-testing')}>
                        Go to Store Testing
                    </Button>
                </div>
                <div style={{ marginTop: 24 }}>
                    <Button onClick={() => navigate('/drive-test')}>
                        Go to Drive Test
                    </Button>
                </div>
            </div>
            {auth.currentUser ? <div style={{ marginTop: 24 }}>
                Logged in as ({auth.currentUser.type}): {auth.currentUser.name} ({auth.currentUser.email})
                <div style={{ marginTop: 12 }}>
                    <Button onClick={() => auth.logout()}>Logout</Button>
                </div>
            </div> : <div style={{ marginTop: 24 }}>
                You are not logged in.
                <LoginComponent />
            </div>}

            {auth.currentUser &&
                <>
                    <div style={{ marginTop: 24 }}>
                        <Button onClick={loadSpaces}>Load</Button>
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-row items-center">
                            {spaces?.map(s =>
                                <Button key={s.id} variant={selectedSpace?.id === s.id ? 'default' : 'ghost'}
                                    onClick={() => selectSpace(s)}>{s.displayName}</Button>
                            )}
                        </div>
                        {selectedSpace && <div className="flex flex-col gap-1">
                            Parent Folder: {
                                folderStack.length > 0 ?
                                    <span onClick={() => previousFolder()}>📁 {folderStack[folderStack.length - 1].displayName}</span> :
                                    <span>Root</span>
                            }
                            {!folders ?
                                <div><Spinner /></div> :
                                folders.map(f =>
                                    <div key={f.id} className="pl-4" onClick={() => selectFolder(f)}>📁 {f.displayName}</div>
                                )
                            }
                        </div>}
                        {selectedSpace?.id === 'drive' &&
                            <div style={{ marginTop: 12 }}>
                                <Button onClick={createFolder}>Create Folder</Button>
                            </div>
                        }
                    </div>
                </>
            }
        </div>
    );
};

export default Dashboard;
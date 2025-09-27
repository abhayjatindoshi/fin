import { DrivePersistence } from '@/modules/app/store/DrivePersistence';
import { Button } from '@/modules/base-ui/components/ui/Button';
import { useEffect, useState } from 'react';

export default function DriveTest() {

    const [drive, setDrive] = useState<DrivePersistence | undefined>();
    const [initialized, setInitialized] = useState(false);
    const [loggedIn, setLoggedIn] = useState(false);
    const [files, setFiles] = useState<gapi.client.drive.File[]>([]);

    useEffect(() => {
        const drive = new DrivePersistence();
        setDrive(drive);
        drive!.initialize().then(() => {
            setInitialized(true);
        }).catch(err => {
            console.error('Error initializing Drive API:', err);
        });
    }, []);

    const login = async () => {
        await drive!.login();
        setLoggedIn(true);
    }

    const listFiles = async () => {
        const response = await drive!.listFiles();
        setFiles(response.result.files || []);
        console.log('Files:', response.result.files);
    }

    const createFile = async () => {
        const fileContent = 'Hello, world!';
        await drive!.createFile('hello.txt', fileContent);
    }

    const readFile = async (fileId: string) => {
        const content = await drive!.readFile(fileId);
        console.log('File content:', content);
    }

    return (
        <div style={{ padding: 24 }}>
            <h2>Drive Testing</h2>
            <p>Initialized: {initialized ? 'Yes' : 'No'}</p>
            {initialized && <Button onClick={login}>Login to Google Drive</Button>}
            {loggedIn && <Button onClick={listFiles} style={{ marginLeft: 8 }}>List Files</Button>}
            {loggedIn && <Button onClick={createFile} style={{ marginLeft: 8 }}>Create File</Button>}
            {files.length > 0 && (
                <div style={{ marginTop: 16 }}>
                    <h3>Files:</h3>
                    <ul>
                        {files.map(file => (
                            <li key={file.id}>{file.name} (ID: {file.id}) <Button onClick={() => readFile(file.id || '')}>Read</Button></li>
                        ))}
                    </ul>
                </div>
            )}
        </div >
    );
}

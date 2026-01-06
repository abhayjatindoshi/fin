import type { IAuthToken } from "@/modules/auth/interfaces/IAuthToken";
import type { IAuthUser } from "@/modules/auth/interfaces/IAuthUser";
import { SettingService } from "../services/SettingService";
import { EmailImportProcessContext } from "./context/EmailImportProcessContext";
import { FileImportProcessContext } from "./context/FileImportProcessContext";
import type { ImportProcessContext } from "./context/ImportProcessContext";
import type { IFile } from "./interfaces/IFileImportAdapter";


export class ImportService {

    private static executions: ImportProcessContext[] = [];
    private settingsService = new SettingService();

    runFileImport(files: File[]): ImportProcessContext {
        const context = new FileImportProcessContext(files);
        this.startExecution(context);
        return context;
    }

    runEmailImport(token: IAuthToken, user: IAuthUser): ImportProcessContext {
        const context = new EmailImportProcessContext(token, user);
        this.startExecution(context);
        return context;
    }

    private startExecution(context: ImportProcessContext): void {
        ImportService.executions.push(context);
        context.setPromise(this.runSync(context));
    }

    private async runSync(context: ImportProcessContext): Promise<void> {
        if (context.isCancelled()) return;
        if (context.type === 'file') {
            const fileContext = context as FileImportProcessContext;
            const files = await Promise.all(fileContext.files.map(f => this.readFile(f)));

        }
    }

    private async readFile(file: File): Promise<IFile | null> {
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
            return this.readPdfFile(file);
        }
        return null;
    }

    private async readPdfFile(file: File): Promise<IFile | null> {

    }

    private async getStoredPasswords(): Promise<string[]> {
        const storedPasswords = await this.settingsService.get("import.storedPasswords");
        try {
            return JSON.parse(storedPasswords) as string[];
        } catch {
            return [];
        }
    }
}
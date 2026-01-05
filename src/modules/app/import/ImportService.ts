import type { IAuthToken } from "@/modules/auth/interfaces/IAuthToken";
import type { IAuthUser } from "@/modules/auth/interfaces/IAuthUser";
import { EmailImportProcessContext } from "./context/EmailImportProcessContext";
import { FileImportProcessContext } from "./context/FileImportProcessContext";
import type { ImportProcessContext } from "./context/ImportProcessContext";


export class ImportService {
    runFileImport(files: File[]): ImportProcessContext {
        const context = new FileImportProcessContext(files);
        return context;
    }

    runEmailImport(token: IAuthToken, user: IAuthUser): ImportProcessContext {
        const context = new EmailImportProcessContext(token, user);
        return context;
    }

}
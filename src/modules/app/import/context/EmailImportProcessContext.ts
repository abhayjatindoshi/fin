import type { IAuthToken } from "@/modules/auth/interfaces/IAuthToken";
import type { IAuthUser } from "@/modules/auth/interfaces/IAuthUser";
import type { IEmailImportAdapter } from "../interfaces/IEmailImportAdapter";
import type { EmailImportState, ImportSource } from "../interfaces/ImportData";
import { ImportProcessContext } from "./ImportProcessContext";

export class EmailImportProcessContext extends ImportProcessContext {
    token: IAuthToken;
    user: IAuthUser;
    state: EmailImportState;
    adapter: IEmailImportAdapter | null = null;

    constructor(token: IAuthToken, user: IAuthUser, state: EmailImportState = {}) {
        super('email');
        this.token = token;
        this.user = user;
        this.state = state;
    }

    getSource(): ImportSource {
        throw new Error("Method not implemented.");
    }
}
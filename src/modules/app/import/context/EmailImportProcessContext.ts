import type { IAuthToken } from "@/modules/auth/interfaces/IAuthToken";
import type { IAuthUser } from "@/modules/auth/interfaces/IAuthUser";
import type { ImportSource } from "../interfaces/ImportData";
import { ImportProcessContext } from "./ImportProcessContext";

export class EmailImportProcessContext extends ImportProcessContext {
    token: IAuthToken;
    user: IAuthUser;

    constructor(token: IAuthToken, user: IAuthUser) {
        super('email');
        this.token = token;
        this.user = user;
    }

    getSource(): ImportSource {
        throw new Error("Method not implemented.");
    }
}
import type { MailAttachment, MailMessage } from "@/modules/auth/interfaces/features/IAuthMailHandler";
import type { IAuthToken } from "@/modules/auth/interfaces/IAuthToken";
import type { IAuthUser } from "@/modules/auth/interfaces/IAuthUser";
import { BehaviorSubject, Observable } from "rxjs";
import { PromptError } from "../errors/PromptError";
import { ImportService } from "../ImportService";
import type { IEmailImportAdapter } from "../interfaces/IEmailImportAdapter";
import type { EmailImportSource, EmailImportState } from "../interfaces/ImportData";
import { ImportProcessContext } from "./ImportProcessContext";

export class EmailImportProcessContext extends ImportProcessContext {
    token: IAuthToken;
    user: IAuthUser;
    email: MailMessage | null = null;
    attachment: MailAttachment | null = null;
    adapter: IEmailImportAdapter | null = null;
    private stateSubject: BehaviorSubject<EmailImportState>

    constructor(token: IAuthToken, user: IAuthUser, state: EmailImportState = {}) {
        super('email', false);
        this.token = token;
        this.user = user;
        this.stateSubject = new BehaviorSubject<EmailImportState>(state);
        if (state.lastError) {
            this.error = PromptError.restore(this, state.lastError);
        }
    }

    get state(): EmailImportState {
        return this.stateSubject.getValue();
    }

    async setState(state: Partial<EmailImportState>) {
        const currentState = this.stateSubject.getValue();
        const newState = { ...currentState, ...state };
        this.stateSubject.next(newState);
        await ImportService.getInstance().store.updateSyncState(this.user.id, newState);
    }

    observeEmailState(): Observable<EmailImportState> {
        return this.stateSubject.asObservable();
    }

    getSource(): EmailImportSource {
        if (!this.email) throw new Error("Email not set in EmailImportProcessContext");
        return {
            type: 'email',
            user: this.user,
            email: this.email,
            attachment: this.attachment || undefined,
        }
    }

    handleError(error: Error) {
        super.handleError(error);
        if (error instanceof PromptError) {
            const importError = error.persist();
            this.setState({ lastError: importError });
        }
    }
}
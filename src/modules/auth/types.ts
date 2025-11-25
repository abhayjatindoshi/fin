export type AuthType =
    | 'google'
// other auth types can be added here

export type UserDetails = {
    id: string;
    type: AuthType;
    name: string;
    email: string;
    picture: string;
}

export interface AuthHandler<AuthToken extends Token, AuthStateData extends StateData> {
    type: AuthType;
    restore(token: AuthToken): Promise<boolean>;
    loginUrl(state: string): Promise<[string, AuthStateData?]>;
    callback(params: Record<string, string>, stateData?: AuthStateData): Promise<AuthToken | null>;
    logout(): Promise<void>;
    getToken(): Promise<AuthToken | null>;
    getUserDetails(): Promise<UserDetails | null>;
}

export type Token = {
    type: AuthType;
    token: string;
    expiry: Date;
}

export type StateData = {
    type: AuthType;
    state: string;
}

export type LoginButtonProps = {
    onClick: () => void;
    loading: boolean;
    disabled: boolean;
} 
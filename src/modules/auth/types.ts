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

export interface AuthHandler {
    type: AuthType;
    restore(token: Token): Promise<boolean>;
    login(): Promise<void>;
    logout(): Promise<void>;
    getToken(): Promise<Token | null>;
    getUserDetails(): Promise<UserDetails | null>;
}

export type Token = {
    type: AuthType;
    token: string;
    expiry: Date;
}

export type LoginButtonProps = {
    onClick: () => void;
    loading: boolean;
    disabled: boolean;
} 
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Utils } from "../common/Utils";
import { GoogleAuthHandler, type GoogleAuthConfig } from "./google/GoogleAuthHandler";
import type { AuthHandler, AuthType, Token, UserDetails } from "./types";

type BaseAuthConfig = {
    type: AuthType;
}

export type AuthConfig = BaseAuthConfig & (
    | GoogleAuthConfig
    // other auth configs can be added here
);

type AuthProviderState = {
    currentUser: UserDetails | null;
    supportedAuthTypes: AuthType[];
    login: (type: AuthType) => Promise<void>;
    token: () => Promise<Token | null>;
    logout: () => Promise<void>;
}

const AuthProviderContext = createContext<AuthProviderState | undefined>(undefined);

type AuthProviderProps = {
    config: AuthConfig[];
    storageKey?: string;
    children: React.ReactNode;
}

export const AuthProvider = ({ config, storageKey = 'auth', children }: AuthProviderProps) => {
    const [handler, setHandler] = useState<AuthHandler | null>(null);
    const [currentUser, setCurrentUser] = useState<UserDetails | null>(null);
    const supportedAuthTypes = useMemo(() => config.map(c => c.type), [config]);

    const createHandler = (conf: AuthConfig): AuthHandler => {
        switch (conf.type) {
            case 'google': return new GoogleAuthHandler(conf as GoogleAuthConfig);
            // other auth handlers can be added here
        }
    };

    const clearSession = (reason?: string) => {
        if (reason) console.warn('[AuthProvider] Clearing session:', reason);
        localStorage.removeItem(storageKey);
        setHandler(null);
        setCurrentUser(null);
    }

    const restore = async () => {
        const storedTokenString = localStorage.getItem(storageKey);
        if (!storedTokenString) return;

        const storedToken = Utils.parseJson<Token>(storedTokenString);
        if (!storedToken || !storedToken.type) return clearSession('Invalid stored token format');

        const conf = config.find(c => c.type === storedToken.type);
        if (!conf) return clearSession('No config for stored token type');

        const newHandler = createHandler(conf);
        try {
            const restored = await newHandler.restore(storedToken);
            if (!restored) return clearSession();

            const user = await newHandler.getUserDetails();
            if (!user) return clearSession('Could not obtain user after restore');

            setHandler(newHandler);
            setCurrentUser(user);

        } catch (e) {
            return clearSession('Error during restore: ' + (e as Error).message);
        }
    }

    useEffect(() => {
        restore();
    }, []);

    const token = async (): Promise<Token | null> => {
        if (!handler) return null;
        const t = await handler.getToken();
        if (t) localStorage.setItem(storageKey, Utils.stringifyJson(t));
        return t;
    }

    const login = async (type: AuthType): Promise<void> => {
        const conf = config.find(c => c.type === type);
        if (!conf) throw new Error(`No configuration found for auth type: ${type}`);

        const newHandler = createHandler(conf);
        setHandler(newHandler);

        await newHandler.login();

        const token = await newHandler.getToken();
        if (token) localStorage.setItem(storageKey, Utils.stringifyJson(token));

        const user = await newHandler.getUserDetails();
        setCurrentUser(user);
    }

    const logout = async (): Promise<void> => {
        await handler?.logout();
        clearSession();
    }

    return <AuthProviderContext.Provider value={{ currentUser, supportedAuthTypes, login, token, logout, }}>
        {children}
    </AuthProviderContext.Provider>
}

export const useAuth = () => {
    const context = useContext(AuthProviderContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
}
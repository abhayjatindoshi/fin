import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AppLogger } from "../app/logging/AppLogger";
import { Utils } from "../common/Utils";
import { Utils as AuthUtils } from "./Utils";
import { type GoogleAuthConfig, GoogleAuthHandler } from "./google/GoogleAuthHandler";
import type { AuthHandler, AuthType, StateData, Token, UserDetails } from "./types";

export type BaseAuthConfig = {
    type: AuthType;
    callbackUrl?: string;
}

export type AuthConfig = BaseAuthConfig & (
    | GoogleAuthConfig
    // other auth configs can be added here
);

type AuthProviderState = {
    currentUser: UserDetails | null;
    supportedAuthTypes: AuthType[];
    authType: AuthType | null;
    loading: boolean;
    login: (type: AuthType) => Promise<void>;
    callback: () => Promise<void>;
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
    const logger = AppLogger.tagged('AuthProvider');
    const [handler, setHandler] = useState<AuthHandler<Token, StateData> | null>(null);
    const [currentUser, setCurrentUser] = useState<UserDetails | null>(null);
    const [loading, setLoading] = useState(false);
    const supportedAuthTypes = useMemo(() => config.map(c => c.type), [config]);

    const createHandler = (conf: AuthConfig): AuthHandler<Token, StateData> | undefined => {
        switch (conf.type) {
            case 'google': return new GoogleAuthHandler(conf as GoogleAuthConfig)
            // other auth handlers can be added here
        }
    };

    const clearSession = (reason?: string) => {
        if (reason) logger.w('Clearing session:', reason);
        localStorage.removeItem(storageKey);
        setHandler(null);
        setCurrentUser(null);
    }

    const restore = useCallback(async () => {
        setLoading(true);
        try {
            const storedTokenString = localStorage.getItem(storageKey);
            if (!storedTokenString) return;

            const storedToken = Utils.parseJson<Token>(storedTokenString);
            if (!storedToken || !storedToken.type) return clearSession('Invalid stored token format');

            const conf = config.find(c => c.type === storedToken.type);
            if (!conf) return clearSession('No config for stored token type');

            const newHandler = createHandler(conf);
            if (!newHandler) return clearSession('Could not create handler for stored token type');
            setHandler(newHandler);

            const restored = await newHandler.restore(storedToken);
            if (!restored) return clearSession();

            const user = await newHandler.getUserDetails();
            if (!user) return clearSession('Could not obtain user after restore');

            logger.i('Restored session for user:', user);
            setCurrentUser(user);

        } catch (e) {
            return clearSession('Error during restore: ' + (e as Error).message);
        } finally {
            setLoading(false);
        }
    }, [config]);

    useEffect(() => {
        restore();
    }, [restore]);

    const token = useCallback(async (): Promise<Token | null> => {
        if (!handler) return null;
        const t = await handler.getToken();
        if (t) localStorage.setItem(storageKey, Utils.stringifyJson(t));
        return t;
    }, [handler]);

    const login = useCallback(async (type: AuthType): Promise<void> => {
        setLoading(true);
        try {
            const conf = config.find(c => c.type === type);
            if (!conf) throw new Error(`No configuration found for auth type: ${type}`);

            const newHandler = createHandler(conf);
            if (!newHandler) throw new Error(`Could not create auth handler for type: ${type}`);
            setHandler(newHandler);

            const state = `${storageKey}-state-${type}-${AuthUtils.bytesToString(AuthUtils.getRandomBytes(8))}`;
            const [loginUrl, stateData] = await newHandler.loginUrl(state);
            if (stateData) {
                localStorage.setItem(state, Utils.stringifyJson(stateData));
            }

            window.location.href = loginUrl;
        } finally {
            setLoading(false);
        }
    }, [config]);

    const callback = useCallback(async (): Promise<void> => {
        setLoading(true);
        try {
            const params = new URLSearchParams(window.location.search);
            const state = params.get('state');
            if (!state) return;
            const stateDataString = localStorage.getItem(state);
            if (!stateDataString) return;

            Object.keys(localStorage)
                .filter(key => key.startsWith(`${storageKey}-state-`))
                .forEach(key => localStorage.removeItem(key));

            const stateData = Utils.parseJson<StateData>(stateDataString);
            const conf = config.find(c => c.type === stateData.type);
            if (!conf) throw new Error(`No configuration found for auth type: ${stateData.type}`);

            const newHandler = createHandler(conf);
            if (!newHandler) throw new Error(`Could not create auth handler for type: ${stateData.type}`);
            setHandler(newHandler);

            const authToken = await newHandler.callback(Object.fromEntries(params), stateData);
            if (!authToken) throw new Error('Authentication failed: No token received');

            const user = await newHandler.getUserDetails();
            if (!user) throw new Error('Authentication failed: Could not obtain user details');

            localStorage.setItem(storageKey, Utils.stringifyJson(authToken));

            setCurrentUser(user);
            logger.i('User logged in:', user);

        } finally {
            setLoading(false);
        }

    }, [storageKey]);

    const logout = useCallback(async (): Promise<void> => {
        await handler?.logout();
        clearSession();
        window.location.href = '/';
    }, [handler]);

    return <AuthProviderContext.Provider value={{
        currentUser, supportedAuthTypes, loading,
        authType: handler?.type || null,
        login, callback, token, logout,
    }}>
        {children}
    </AuthProviderContext.Provider>
}

export const useAuth = () => {
    const context = useContext(AuthProviderContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
}
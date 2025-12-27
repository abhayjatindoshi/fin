import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren } from "react";
import { AppLogger } from "../app/logging/AppLogger";
import { AuthService } from "../app/services/AuthService";
import type { IAuthToken } from "./interfaces/IAuthToken";
import type { IAuthUser } from "./interfaces/IAuthUser";

type AuthProviderState = {
    currentUser: IAuthUser | null;
    loading: boolean;
    token: () => Promise<IAuthToken | null>;
    logout: () => void;
    useTokenForLogin: (token: IAuthToken) => Promise<void>;
}

const AuthProviderContext = createContext<AuthProviderState | undefined>(undefined);

export const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const logger = AppLogger.tagged('AuthProvider');
    const [loading, setLoading] = useState<boolean>(false);
    const [currentUser, setCurrentUser] = useState<IAuthUser | null>(null);
    const [currentToken, setCurrentToken] = useState<IAuthToken | null>(null);
    const service = useRef(new AuthService()).current;
    const tokenChain = useRef(Promise.resolve<IAuthToken | null>(null));

    const handleError = (error: unknown, message: string) => {
        logger.e('Auth error', message, error);
        logout();
        return null;
    }

    // restore session if possible
    useEffect(() => {
        const existingToken = service.getTokenIfExists();
        if (existingToken) {
            useTokenForLogin(existingToken)
                .catch(e => handleError(e, 'Failed to restore session'))
        }
    }, []);

    const token = async (): Promise<IAuthToken | null> => {
        tokenChain.current = tokenChain.current.then(async () => {
            try {
                if (!currentToken) return null;
                const token = await service.getValidToken(currentToken);
                setCurrentToken(token);
                return token;
            } catch (error) {
                return handleError(error, 'Failed to get valid token');
            }
        });
        return tokenChain.current;
    }

    const logout = (): void => {
        service.logout();
        setCurrentToken(null);
        setCurrentUser(null);
    }

    const useTokenForLogin = async (token: IAuthToken): Promise<void> => {
        setLoading(true);
        try {
            const user = await service.loginUsingToken(token);
            setCurrentToken(token);
            setCurrentUser(user);
        } catch (error) {
            handleError(error, 'Failed to login using token');
        } finally {
            setLoading(false);
        }
    }

    return <AuthProviderContext.Provider value={{ currentUser, loading, token, logout, useTokenForLogin }}>
        {children}
    </AuthProviderContext.Provider>
}

export const useAuth = (): AuthProviderState => {
    const context = useContext(AuthProviderContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
}
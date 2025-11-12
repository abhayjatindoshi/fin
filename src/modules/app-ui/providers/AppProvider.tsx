import React, { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';

type WindowWithDevMode = Window & {
    enableDevMode?: () => void;
    disableDevMode?: () => void;
}

interface AppContextProps {
    width: number;
    isMobile: boolean;
    devModeEnabled: boolean;
    setDevModeEnabled: (enabled: boolean) => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const [width, setWidth] = useState<number>(window.innerWidth);
    const [devModeEnabled, setDevModeEnabled] = useState<boolean>(false);

    useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth);

        window.addEventListener('resize', handleResize);
        (window as WindowWithDevMode).enableDevMode = () => setDevModeEnabled(true);
        (window as WindowWithDevMode).disableDevMode = () => setDevModeEnabled(false);

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = width <= 768;

    return (
        <AppContext.Provider value={{ width, isMobile, devModeEnabled, setDevModeEnabled }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};
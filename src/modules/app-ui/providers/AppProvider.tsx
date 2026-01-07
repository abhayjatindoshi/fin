import { ImportService } from '@/modules/app/import/ImportService';
import { ImportStoreService } from '@/modules/app/services/ImportStoreService';
import { SettingService, type SettingKeys } from '@/modules/app/services/SettingService';
import { useDataSync } from '@/modules/data-sync/providers/DataSyncProvider';
import React, { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

type WindowWithDevMode = Window & {
    enableDevMode?: () => void;
    disableDevMode?: () => void;
}

interface AppContextProps {
    width: number;
    isMobile: boolean;

    settings: Record<SettingKeys, string> | null;
    updateSetting: (key: SettingKeys, value: string) => Promise<boolean>;

    devModeEnabled: boolean;
    setDevModeEnabled: (enabled: boolean) => void;

    scrollElementRef?: React.RefObject<HTMLElement | null>;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

type AppProviderProps = PropsWithChildren<{
    scrollElementRef?: React.RefObject<HTMLElement | null>;
}>;

export const AppProvider: React.FC<AppProviderProps> = ({ children, scrollElementRef }) => {

    ImportService.initialize(new ImportStoreService());

    const { orchestrator } = useDataSync();
    const settingsService = useMemo(() => orchestrator ? new SettingService() : null, [orchestrator]);
    const [width, setWidth] = useState<number>(window.innerWidth);
    const [devModeEnabled, setDevModeEnabled] = useState<boolean>(false);
    const [settings, setSettings] = useState<Record<SettingKeys, string> | null>(null);

    useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth);

        window.addEventListener('resize', handleResize);
        (window as WindowWithDevMode).enableDevMode = () => setDevModeEnabled(true);
        (window as WindowWithDevMode).disableDevMode = () => setDevModeEnabled(false);

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!settingsService) return;
        const subscription = settingsService.observe().subscribe(setSettings);
        return () => subscription.unsubscribe();
    }, [settingsService]);

    const isMobile = width <= 768;

    const updateSetting = async (key: SettingKeys, value: string) => {
        if (!settingsService) return false;
        return settingsService.update(key, value);
    }

    return (
        <AppContext.Provider value={{
            width, isMobile,
            settings, updateSetting,
            devModeEnabled, setDevModeEnabled,
            scrollElementRef,
        }}>
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
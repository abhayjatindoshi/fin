import type React from "react";
import { AuthProvider } from "../auth/AuthProvider";
import { ThemeProvider } from "../base-ui/components/theme-provider";
import { DataSyncProvider } from "../data-sync/DataSyncProvider";
import { AuthConfigMap } from "./AuthMap";
import AppRouter from "./router";

export const App: React.FC = () => {

    return (
        <ThemeProvider defaultTheme='dark' storageKey='fin-ui-theme'>
            <AuthProvider config={Object.values(AuthConfigMap)} storageKey='fin-auth'>
                <DataSyncProvider>
                    <AppRouter />
                </DataSyncProvider>
            </AuthProvider>
        </ThemeProvider>
    )
}
import type React from "react";
import { AuthProvider } from "../auth/AuthProvider";
import { ThemeProvider } from "../base-ui/components/theme-provider";
import { DataSyncProvider } from "../data-sync/DataSyncProvider";
import { AuthConfigMap } from "./AuthMap";
import AppRouter from "./router";

export const App: React.FC = () => {

    return (
        <ThemeProvider defaultTheme='dark' storageKey='fin-ui-theme'>
            <div className="grainy h-full bg-gradient-to-r from-background to-muted/10">
                <AuthProvider config={Object.values(AuthConfigMap)} storageKey='fin-auth'>
                    <DataSyncProvider>
                        <AppRouter />
                    </DataSyncProvider>
                </AuthProvider>
            </div>
        </ThemeProvider>
    )
}
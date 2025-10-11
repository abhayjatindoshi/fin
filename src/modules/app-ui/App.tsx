import type React from "react";
import { AuthProvider } from "../auth/AuthProvider";
import { ThemeProvider } from "../base-ui/components/theme-provider";
import { DataSyncProvider } from "../data-sync/providers/DataSyncProvider";
import { TenantProvider } from "../data-sync/providers/TenantProvider";
import { AuthConfigMap } from "./AuthMap";
import { AppProvider } from "./providers/AppProvider";
import AppRouter from "./router";

export const App: React.FC = () => {

    return (
        <AppProvider>
            <ThemeProvider defaultTheme='dark' storageKey='fin-ui-theme'>
                <div className="h-screen grainy bg-gradient-to-r from-background to-muted/10">
                    <div className="overflow-auto h-full">
                        <AuthProvider config={Object.values(AuthConfigMap)} storageKey='fin-auth'>
                            <TenantProvider>
                                <DataSyncProvider>
                                    <AppRouter />
                                </DataSyncProvider>
                            </TenantProvider>
                        </AuthProvider>
                    </div>
                </div>
            </ThemeProvider>
        </AppProvider>
    )
}
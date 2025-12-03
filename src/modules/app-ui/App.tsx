import type React from "react";
import { useRef } from "react";
import { AuthConfigMap } from "../app/AuthMap";
import { AuthProvider } from "../auth/AuthProvider";
import { ThemeProvider } from "../base-ui/components/theme-provider";
import { DataSyncProvider } from "../data-sync/providers/DataSyncProvider";
import { TenantProvider } from "../data-sync/providers/TenantProvider";
import { ImportProvider } from "./components/import/ImportProvider";
import { AppProvider } from "./providers/AppProvider";
import { EntityProvider } from "./providers/EntityProvider";
import AppRouter from "./router";

export const App: React.FC = () => {

    const scrollElementRef = useRef<HTMLDivElement | null>(null);

    return (
        <ThemeProvider defaultTheme='dark' storageKey='fin-ui-theme'>
            <div className="h-full grainy bg-gradient-to-br from-background to-muted/10">
                <div ref={scrollElementRef} className="overflow-auto h-full">
                    <AuthProvider config={Object.values(AuthConfigMap)} storageKey='fin-auth'>
                        <TenantProvider>
                            <DataSyncProvider>
                                <AppProvider scrollElementRef={scrollElementRef}>
                                    <EntityProvider>
                                        <ImportProvider>
                                            <AppRouter />
                                        </ImportProvider>
                                    </EntityProvider>
                                </AppProvider>
                            </DataSyncProvider>
                        </TenantProvider>
                    </AuthProvider>
                </div>
            </div>
        </ThemeProvider>
    )
}
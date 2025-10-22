import React, { useEffect, useMemo } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import { AuthServiceMap } from "../app/AuthMap";
import { util } from "../app/entities/entities";
import { AppLogger } from "../app/logging/AppLogger";
import { DateStrategy } from "../app/store/DateStrategy";
import { LocalPersistence } from "../app/store/local/LocalPersistence";
import { MemStore } from "../app/store/memory/MemStore";
import { useAuth } from "../auth/AuthProvider";
import { LoginComponent } from "../auth/LoginComponent";
import { Spinner } from "../base-ui/components/ui/spinner";
import { useDataSync } from "../data-sync/providers/DataSyncProvider";
import { useTenant } from "../data-sync/providers/TenantProvider";
import TenantSelectionComponent from "../data-sync/ui/TenantSelectionComponent";
import Dropzone from "./common/Dropzone";
import Logo from "./common/Logo";
import { ThemeSwitcher } from "./common/ThemeSwitcher";

export const AppLoader: React.FC = () => {
    const { currentUser, loading: authLoading, token } = useAuth();
    const { load: loadDataSync, orchestrator, unload, loading: dataSyncLoading } = useDataSync();
    const { load: loadTenant, manager, currentTenant, setCurrentTenant, loading: tenantLoading } = useTenant();
    const { householdId } = useParams();
    const navigate = useNavigate();

    const loading = dataSyncLoading || tenantLoading || authLoading;

    const cloudService = useMemo(() => {
        if (!currentUser || !token) return null;
        return AuthServiceMap[currentUser.type](token);
    }, [currentUser, token]);

    useEffect(() => {
        if (!householdId || householdId != currentTenant?.id) {
            setCurrentTenant(null);
            unload();
        }
    }, [householdId, currentTenant]);

    useEffect(() => {
        if (!householdId || !manager) return;
        if (!currentTenant) {
            manager.get(householdId)
                .then(tenant => setCurrentTenant(tenant))
        }
    }, [householdId, currentTenant, manager, setCurrentTenant]);

    useEffect(() => {
        if (!cloudService) return;
        loadTenant({
            util: util,
            store: MemStore.getInstance(),
            logger: AppLogger.getInstance(),
            local: new LocalPersistence(),
            cloud: cloudService,
            strategy: new DateStrategy(),
        });
    }, [cloudService, loadTenant]);

    useEffect(() => {
        const beforeUnload = async (e: Event) => {
            if (!orchestrator) return;
            if (orchestrator.isDirty()) {
                e.preventDefault();
                unload();
                if (window.location.pathname !== '/') {
                    setCurrentTenant(null);
                    navigate('/');
                }
            }
        };

        window.addEventListener('beforeunload', beforeUnload);

        return () => {
            window.removeEventListener('beforeunload', beforeUnload);
        };
    }, [orchestrator, unload]);

    useEffect(() => {
        if (!manager || !cloudService || !currentTenant) return;
        const newConfig = manager.getDataSyncConfig(currentTenant);
        loadDataSync(newConfig);

    }, [manager, cloudService, currentTenant, loadDataSync]);

    if (householdId && orchestrator && householdId == currentTenant?.id && orchestrator.ctx.tenant.id == householdId) return <>
        <Outlet />
        <Dropzone
            acceptedFileTypes={['.json', '.csv', 'image/*']}
            onFileDrop={(files) => console.log('Files dropped:', files.length)}
        />
    </>;

    return <div className="flex flex-col items-center h-full w-full">
        <div className="absolute top-8 right-8">
            <ThemeSwitcher />
        </div>
        <div className="mt-32 mb-8">
            <Logo size="large" />
        </div>
        {loading ? <Spinner /> :
            !currentUser ? <LoginComponent /> :
                !householdId ? <TenantSelectionComponent tenantStr="household" onSelect={(tenant) => navigate('/' + tenant.id)} /> :
                    <Spinner />
        }
    </div>
}
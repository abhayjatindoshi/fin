import { util } from "@/modules/app/entities/entities";
import type { Household } from "@/modules/app/entities/Household";
import { AppLogger } from "@/modules/app/logging/AppLogger";
import { GoogleDriveFileService } from "@/modules/app/store/cloud/google-drive/GoogleDriveFileService";
import { DateStrategy } from "@/modules/app/store/DateStrategy";
import { LocalPersistence } from "@/modules/app/store/local/LocalPersistence";
import { MemStore } from "@/modules/app/store/memory/MemStore";
import { useAuth } from "@/modules/auth/AuthProvider";
import { Spinner } from "@/modules/base-ui/components/ui/spinner";
import type { IPersistence } from "@/modules/data-sync/interfaces/IPersistence";
import { useDataSync } from "@/modules/data-sync/providers/DataSyncProvider";
import { useTenant } from "@/modules/data-sync/providers/TenantProvider";
import TenantSelectionComponent from "@/modules/data-sync/ui/TenantSelectionComponent";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const HouseholdPage: React.FC = () => {

    const navigate = useNavigate();
    const [params] = useSearchParams();
    const { currentUser, token } = useAuth();
    const { orchestrator, load: loadDataSync, unload: unloadDataSync } = useDataSync();
    const { setCurrentTenant, load: loadTenantManager, manager: tenantManager } = useTenant();
    const [loading, setLoading] = useState(false);

    const backToHome = useCallback(() => {
        const returnUrl = params.get('returnUrl') || '/';
        navigate(returnUrl);
        return null;
    }, [navigate, params]);

    const loadHousehold = useCallback(async (householdId?: string) => {
        if (!householdId || !tenantManager) return;
        setLoading(true);
        try {
            const tenant = await tenantManager.get(householdId);
            if (!tenant) return;
            setCurrentTenant(tenant);
            const config = tenantManager.getDataSyncConfig(tenant);
            await loadDataSync(config);

            const currentHouseholdId = params.get('householdId');
            if (currentHouseholdId !== householdId) {
                navigate('/' + householdId);
            } else {
                backToHome();
            }
        } finally {
            setLoading(false);
        }
    }, [tenantManager, setCurrentTenant, loadDataSync, navigate, params, backToHome]);

    useEffect(() => {
        const householdId = params.get('householdId');
        if (!householdId) {
            unloadDataSync();
        } else if (orchestrator && orchestrator.ctx.tenant.id === householdId) {
            backToHome();
        } else {
            loadHousehold(householdId);
        }
    }, [loadHousehold, unloadDataSync, orchestrator, params, backToHome]);

    useEffect(() => {
        if (orchestrator) return;
        if (!currentUser) return;

        token().then(tokenObj => {
            if (!tokenObj) return;
            let cloudService: IPersistence<Household> | null = null;

            switch (tokenObj.handlerId) {
                case 'google-drive':
                    cloudService = GoogleDriveFileService.load(token);
                    break;
            }
            if (!cloudService) return;

            loadTenantManager({
                util: util,
                store: MemStore.getInstance(),
                logger: AppLogger.getInstance(),
                local: new LocalPersistence(),
                cloud: cloudService,
                strategy: new DateStrategy(),
            });
        })

    }, [currentUser, loadTenantManager, orchestrator]);

    if (loading) return <Spinner />;
    return <TenantSelectionComponent tenantStr="household" onSelect={(tenant) => loadHousehold(tenant.id)} />
}

export default HouseholdPage;
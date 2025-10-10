import { useEffect, useMemo, useRef, type DependencyList, type EffectCallback } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import { util } from "../app/entities/entities";
import { DateStrategy } from "../app/store/DateStrategy";
import { LocalPersistence } from "../app/store/LocalPersistence";
import { MemStore } from "../app/store/MemStore";
import { useAuth } from "../auth/AuthProvider";
import { LoginComponent } from "../auth/LoginComponent";
import { Spinner } from "../base-ui/components/ui/spinner";
import { useDataSync } from "../data-sync/providers/DataSyncProvider";
import { useTenant } from "../data-sync/providers/TenantProvider";
import TenantSelectionComponent from "../data-sync/ui/TenantSelectionComponent";
import { AuthServiceMap } from "./AuthMap";
import Logo from "./common/Logo";
import { ThemeSwitcher } from "./common/ThemeSwitcher";

export const AppLoader: React.FC = () => {
    const { currentUser, token } = useAuth();
    const { load: loadDataSync, unload, loading: dataSyncLoading } = useDataSync();
    const { load: loadTenant, tenants, currentTenant, setCurrentTenant, loading: tenantLoading } = useTenant();
    const { householdId } = useParams();
    const navigate = useNavigate();

    const loading = dataSyncLoading || tenantLoading;

    const cloudService = useMemo(() => {
        if (!currentUser || !token) return null;
        return AuthServiceMap[currentUser.type](token);
    }, [currentUser, token]);

    useEffect(() => {
        if (!householdId || tenants.length === 0) return;
        if (currentTenant == null) {
            const tenant = tenants.find(t => t.id === householdId);
            if (tenant) {
                setCurrentTenant(tenant);
            } else {
                navigate('/');
            }
        }
    }, [householdId, currentTenant, tenants, setCurrentTenant, navigate]);

    useEffect(() => {
        if (!cloudService) return;
        loadTenant({
            util: util,
            store: MemStore.getInstance(),
            local: new LocalPersistence(),
            cloud: cloudService,
            strategy: new DateStrategy(),
        });
    }, [cloudService, loadTenant]);

    useEffect(() => {
        const beforeUnload = async (e: Event) => {
            if (!householdId) return;
            navigate('/');
            e.preventDefault();
            await new Promise(resolve => setTimeout(resolve, 10000));
            return true;
        };

        window.addEventListener('beforeunload', beforeUnload);

        // clearing orchestrator if householdId is missing
        if (!householdId) {
            unload();
        }

        return () => {
            window.removeEventListener('beforeunload', beforeUnload);
        };
    }, [householdId, unload]);

    useEffect(() => {
        if (!cloudService || !currentTenant) return;
        const newConfig = {
            util: util,
            tenant: currentTenant,
            store: MemStore.getInstance(),
            local: new LocalPersistence(),
            cloud: cloudService,
            strategy: new DateStrategy(),
        }

        loadDataSync(newConfig);

    }, [cloudService, currentTenant, loadDataSync]);

    return (currentUser && currentTenant && !loading) ? <Outlet /> :
        <div className="flex flex-col items-center h-full w-full">
            <div className="absolute top-8 right-8">
                <ThemeSwitcher />
            </div>
            <div className="mt-32 mb-8">
                <Logo size="large" />
            </div>
            {loading && <Spinner />}
            {!loading && !currentUser && <LoginComponent />}
            {!loading && currentUser && !householdId && <TenantSelectionComponent tenantStr="household" onSelect={(tenant) => navigate('/' + tenant.id)} />}
        </div>
}


const usePrevious = <T,>(value: T, initialValue: T) => {
    const ref = useRef(initialValue);
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
};

export const useEffectDebugger = (effectHook: EffectCallback, dependencies: DependencyList, dependencyNames: string[] = []) => {
    const previousDeps = usePrevious(dependencies, []);

    const changedDeps = dependencies.reduce<Record<string | number, { before: unknown; after: unknown }>>((accum, dependency, index) => {
        if (dependency !== previousDeps[index]) {
            const keyName = dependencyNames[index] || index;
            return {
                ...accum,
                [keyName]: {
                    before: previousDeps[index],
                    after: dependency
                }
            };
        }

        return accum;
    }, {});

    if (Object.keys(changedDeps).length) {
        console.log('[use-effect-debugger] ', changedDeps);
    }

    useEffect(effectHook, dependencies);
};
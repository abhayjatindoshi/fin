import { useEffect, useMemo, useRef, type DependencyList, type EffectCallback } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import { util } from "../app/entities/entities";
import { DateStrategy } from "../app/store/DateStrategy";
import { LocalPersistence } from "../app/store/LocalPersistence";
import { MemStore } from "../app/store/MemStore";
import { useAuth } from "../auth/AuthProvider";
import { LoginComponent } from "../auth/LoginComponent";
import { Spinner } from "../base-ui/components/ui/spinner";
import { useDataSync } from "../data-sync/DataSyncProvider";
import { AuthHouseholdPageMap, AuthServiceMap } from "./AuthMap";
import Logo from "./common/Logo";
import { ThemeSwitcher } from "./common/ThemeSwitcher";

export const AppLoader: React.FC = () => {
    const { currentUser, token } = useAuth();
    const { load, unload, loading } = useDataSync();
    const { householdId } = useParams();
    const navigate = useNavigate();

    const cloudService = useMemo(() => {
        if (!currentUser || !token) return null;
        return AuthServiceMap[currentUser.type](token);
    }, [currentUser, token]);

    useEffect(() => {
        const beforeUnload = async (e: Event) => {
            if (!householdId) return;
            navigate('/');
            e.preventDefault();
            await new Promise(resolve => setTimeout(resolve, 1000));
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

    useEffectDebugger(() => {
        if (!currentUser || !householdId || !token || !cloudService) return;
        console.log('AppLoader useEffect', { currentUser, householdId, token, cloudService });
        const newConfig = {
            prefix: householdId,
            util: util,
            store: MemStore.getInstance(),
            local: new LocalPersistence(),
            cloud: cloudService,
            strategy: new DateStrategy(),
        }

        load(newConfig);

    }, [currentUser, householdId, token, cloudService], ['currentUser', 'householdId', 'token', 'cloudService']);

    return (currentUser && householdId && !loading) ? <Outlet /> :
        <div className="flex flex-col items-center h-full w-full">
            <div className="absolute top-8 right-8">
                <ThemeSwitcher />
            </div>
            <div className="mt-32 mb-8">
                <Logo size="large" />
            </div>
            {loading && <Spinner />}
            {!loading && !currentUser && <LoginComponent />}
            {!loading && currentUser && !householdId && (() => {
                const HouseholdPage = AuthHouseholdPageMap[currentUser.type];
                return <HouseholdPage />;
            })()}
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
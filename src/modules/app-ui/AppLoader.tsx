import { useEffect, useMemo } from "react";
import { Outlet, useParams } from "react-router-dom";
import { util } from "../app/entities/entities";
import { DateStrategy } from "../app/store/DateStrategy";
import { LocalPersistence } from "../app/store/LocalPersistence";
import { MemStore } from "../app/store/MemStore";
import { useAuth } from "../auth/AuthProvider";
import { LoginComponent } from "../auth/LoginComponent";
import { useDataSync } from "../data-sync/DataSyncProvider";
import { AuthHouseholdPageMap, AuthServiceMap } from "./AuthMap";
import Logo from "./common/Logo";
import { ThemeSwitcher } from "./common/ThemeSwitcher";

export const AppLoader: React.FC = () => {
    const { currentUser, token } = useAuth();
    const { setConfig } = useDataSync();
    const { householdId } = useParams();

    const cloudService = useMemo(() => {
        if (!currentUser || !token) return null;
        return AuthServiceMap[currentUser.type](token);
    }, [currentUser, token]);

    useEffect(() => {
        if (!currentUser || !householdId || !token || !cloudService) return;
        const config = {
            prefix: householdId,
            util: util,
            store: new MemStore(),
            local: new LocalPersistence(),
            cloud: cloudService,
            strategy: new DateStrategy(),
        }
        setConfig(config);


    }, [currentUser, householdId, token]);

    return (currentUser && householdId) ? <Outlet /> :
        <div className="flex flex-col items-center justify-center h-full w-full">
            <div className="absolute top-8 right-8">
                <ThemeSwitcher />
            </div>
            <div className="mt-32 mb-8">
                <Logo size="large" />
            </div>
            {!currentUser && <LoginComponent />}
            {currentUser && !householdId && (() => {
                const HouseholdPage = AuthHouseholdPageMap[currentUser.type];
                return <HouseholdPage />;
            })()}
        </div>
}
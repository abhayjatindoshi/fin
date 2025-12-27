import React, { useCallback, useEffect } from "react";
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { useDataSync } from "../data-sync/providers/DataSyncProvider";

export const AppLoader: React.FC = () => {
    const { currentUser } = useAuth();
    const { orchestrator } = useDataSync();
    const { householdId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const goToLogin = useCallback(() => {
        const params = {
            returnUrl: location.pathname
        };
        navigate('/auth/login?' + new URLSearchParams(params).toString());
    }, [navigate, location]);

    const goToHouseholdSelection = useCallback(() => {
        const params: Record<string, string> = {
            returnUrl: location.pathname
        };
        if (householdId) {
            params.householdId = householdId;
        }
        navigate('/auth/households?' + new URLSearchParams(params).toString());
    }, [navigate, location, householdId]);

    useEffect(() => {
        if (!currentUser) {
            return goToLogin();
        }

        if (!orchestrator || orchestrator.ctx.tenant.id !== householdId) {
            return goToHouseholdSelection();
        }

    }, [currentUser, orchestrator, householdId, goToLogin, goToHouseholdSelection]);

    useEffect(() => {
        const beforeUnload = async (e: Event) => {
            if (!orchestrator) return;
            if (orchestrator.isDirty()) {
                orchestrator.syncNow();
                e.preventDefault();
            }
        };

        window.addEventListener('beforeunload', beforeUnload);

        return () => {
            window.removeEventListener('beforeunload', beforeUnload);
        };
    }, [orchestrator]);

    if (currentUser && orchestrator) return <Outlet />;
    return <></>
}
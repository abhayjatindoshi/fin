import { AuthService } from "@/modules/app/services/AuthService";
import { useAuth } from "@/modules/auth/AuthProvider";
import { useDataSync } from "@/modules/data-sync/providers/DataSyncProvider";
import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";

const AuthHandlerPage: React.FC = () => {

    const { orchestrator } = useDataSync();
    const { householdId } = useParams();
    const { useTokenForLogin } = useAuth();
    const navigate = useNavigate();
    const service = useRef(new AuthService()).current;

    useEffect(() => {
        if (householdId && !orchestrator) return;
        service.process(useTokenForLogin, householdId).then(url => {
            navigate(url);
        })
    }, [orchestrator, householdId]);

    return <></>;
};

export default AuthHandlerPage;
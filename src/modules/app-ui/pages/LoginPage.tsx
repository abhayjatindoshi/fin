import { AuthService } from "@/modules/app/services/AuthService";
import { AuthMatrix } from "@/modules/auth/AuthMatrix";
import { useAuth } from "@/modules/auth/AuthProvider";
import { createElement, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const LoginPage: React.FC = () => {

    const service = useRef(new AuthService()).current;
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const { loading, currentUser } = useAuth();

    useEffect(() => {
        if (currentUser) {
            const returnUrl = params.get('returnUrl') || '/';
            navigate(returnUrl);
        }
    }, [currentUser, navigate]);

    const login = async (handlerId: string) => {
        await service.login(handlerId);
    }

    return <div className="">
        {Object.values(AuthMatrix.FeatureHandlers['storage']).map((handler) => {
            const display = AuthMatrix.HandlerDisplay[handler.id];
            if (!display) return null;

            return <div key={handler.id} className="m-4 flex flex-col items-stretch">
                {createElement(display.button, {
                    onClick: () => login(handler.id),
                    loading: loading,
                    disabled: loading,
                })}
            </div>
        })}
    </div>;
}

export default LoginPage;
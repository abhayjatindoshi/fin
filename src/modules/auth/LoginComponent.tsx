import { createElement, useState } from "react";
import { useAuth } from "./AuthProvider";
import { GoogleLoginButton } from "./google/GoogleLoginButton";
import type { AuthType, LoginButtonProps } from "./types";

type LoginButtonType = React.FC<LoginButtonProps>;

const buttonMap: Record<AuthType, LoginButtonType> = {
    google: GoogleLoginButton,
}

export const LoginComponent: React.FC = () => {
    const auth = useAuth();
    const [currentTypeLoggingIn, setCurrentTypeLoggingIn] = useState<AuthType | null>(null);

    const login = async (type: AuthType) => {
        setCurrentTypeLoggingIn(type);
        try {
            await auth.login(type);
        } finally {
            setCurrentTypeLoggingIn(null);
        }
    }

    return <div>
        {auth.supportedAuthTypes.map(type => (
            <div key={type} style={{ marginTop: 12 }}>
                {createElement(buttonMap[type], {
                    onClick: () => login(type),
                    loading: currentTypeLoggingIn === type,
                    disabled: currentTypeLoggingIn !== null && currentTypeLoggingIn !== type
                })}
            </div>
        ))}
    </div>
}
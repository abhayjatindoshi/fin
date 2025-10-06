import { LoginComponent } from "@/modules/auth/LoginComponent";
import Logo from "../common/Logo";
import { ThemeSwitcher } from "../common/ThemeSwitcher";

export const LoginPage: React.FC = () => {

    return <div className="flex flex-col items-center justify-center h-full w-full">
        <div className="absolute top-8 right-8">
            <ThemeSwitcher />
        </div>
        <div className="mt-32 mb-8">
            <Logo size="large" />
        </div>
        <LoginComponent />
    </div>
}
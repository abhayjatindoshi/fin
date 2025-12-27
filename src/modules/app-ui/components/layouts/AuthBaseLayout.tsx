import { Outlet } from "react-router-dom";
import Logo from "../../common/Logo";
import { ThemeSwitcher } from "../../common/ThemeSwitcher";

const AuthBaseLayout: React.FC = () => {

    return <div className="flex flex-col items-center h-full w-full">
        <div className="absolute top-8 right-8">
            <ThemeSwitcher />
        </div>
        <div className="mt-32 mb-8">
            <Logo size="xl" />
        </div>
        <Outlet />
    </div>;
}

export default AuthBaseLayout;
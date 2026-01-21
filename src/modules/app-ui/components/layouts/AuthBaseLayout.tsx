import { useAuth } from "@/modules/auth/AuthProvider";
import { Button } from "@/modules/base-ui/components/ui/button";
import { LogOut } from "lucide-react";
import { Outlet } from "react-router-dom";
import Logo from "../../common/Logo";
import { ThemeSwitcher } from "../../common/ThemeSwitcher";

const AuthBaseLayout: React.FC = () => {

    const { currentUser, logout } = useAuth();

    return <div className="flex flex-col items-center h-full w-full">
        <div className="absolute top-8 right-8">
            <div className="flex flex-row gap-2">
                <ThemeSwitcher />
                {currentUser && <Button variant="outline" size="sm" onClick={logout}><LogOut />Logout</Button>}
            </div>
        </div>
        <div className="mt-32 mb-8">
            <Logo size="xl" />
        </div>
        <Outlet />
    </div>;
}

export default AuthBaseLayout;
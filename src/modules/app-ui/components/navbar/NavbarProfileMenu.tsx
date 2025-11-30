import { useAuth } from "@/modules/auth/AuthProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/modules/base-ui/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/modules/base-ui/components/ui/dropdown-menu";
import { useTenant } from "@/modules/data-sync/providers/TenantProvider";
import { CodeXml, LogOut, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ThemeSwitcher } from "../../common/ThemeSwitcher";
import { useApp } from "../../providers/AppProvider";

const NavbarProfileMenu: React.FC = () => {

    const navigate = useNavigate();
    const { currentTenant } = useTenant();
    const { currentUser, logout } = useAuth();
    const { devModeEnabled, setDevModeEnabled } = useApp();


    return (
        <DropdownMenu>
            <DropdownMenuTrigger>
                <div className="rounded-full border backdrop-blur">
                    <Avatar className="size-11 cursor-pointer opacity-60 hover:opacity-100 transition">
                        <AvatarImage src={currentUser?.picture} alt={currentUser?.name} />
                        <AvatarFallback>{currentUser?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-secondary/50 backdrop-blur-xs" align="end" sideOffset={10}>
                <DropdownMenuItem variant="none">
                    <ThemeSwitcher variant="borderless" />
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => setDevModeEnabled(!devModeEnabled)}>
                        <CodeXml />
                        Dev Mode
                        <span className={`flex size-2 rounded-full ${devModeEnabled ? 'bg-green-500' : 'bg-red-500'} `} title={devModeEnabled ? "Enabled" : "Disabled"}></span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/' + currentTenant?.id + '/settings')}>
                        <Settings />
                        Settings
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={logout}>
                    <LogOut />
                    Log out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default NavbarProfileMenu;
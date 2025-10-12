import { useAuth } from "@/modules/auth/AuthProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/modules/base-ui/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/modules/base-ui/components/ui/dropdown-menu";
import { LogOut, RefreshCw, Settings } from "lucide-react";
import { ThemeSwitcher } from "../../common/ThemeSwitcher";

const NavbarProfileMenu: React.FC = () => {

    const { currentUser, logout } = useAuth();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger>
                <div className="rounded-full border backdrop-blur">
                    <Avatar className="size-10 cursor-pointer opacity-60 hover:opacity-100 transition">
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
                    <DropdownMenuItem>
                        <RefreshCw />
                        Sync Now
                    </DropdownMenuItem>
                    <DropdownMenuItem>
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
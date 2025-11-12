import { Tabs, TabsList, TabsTrigger } from "@/modules/base-ui/components/ui/tabs";
import { useTenant } from "@/modules/data-sync/providers/TenantProvider";
import { ArrowRightLeft, Cog, FlaskConical, Home, PieChart } from "lucide-react";
import type { ComponentType } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../../providers/AppProvider";

type NavbarMenuProps = {
    className?: string;
    variant?: 'default' | 'compact';
}

type MenuItem = {
    key: string;
    label: string;
    url: string;
    icon: ComponentType
}

const menu: MenuItem[] = [
    { key: 'dashboard', label: 'Dashboard', url: '/dashboard', icon: Home },
    { key: 'transactions', label: 'Transactions', url: '/transactions', icon: ArrowRightLeft },
    { key: 'budget', label: 'Budget', url: '/budget', icon: PieChart },
    { key: 'settings', label: 'Settings', url: '/settings', icon: Cog },
];

const devMenu: MenuItem[] = [
    { key: 'dev', label: 'Dev', url: '/dev', icon: FlaskConical },
];

const NavbarMenu: React.FC<NavbarMenuProps> = ({ className, variant = 'default' }: NavbarMenuProps) => {

    const location = useLocation();
    const navigate = useNavigate();
    const { currentTenant } = useTenant();
    const { devModeEnabled } = useApp();

    const menuItems = devModeEnabled ? [...menu, ...devMenu] : menu;
    const selectedTab = menuItems.find(item => location.pathname.startsWith('/' + currentTenant?.id + item.url));

    const switchTab = (item: MenuItem) => {
        navigate('/' + currentTenant?.id + item.url);
    }

    return (
        <Tabs value={selectedTab?.key}>
            <TabsList className={`h-12 ${className}`}>
                {menuItems.map(item => (
                    <TabsTrigger value={item.key} key={item.key} onClick={() => switchTab(item)}
                        className="px-3 py-1 rounded-3xl text-base border-0 cursor-pointer relative
                                after:absolute after:-top-1.5 after:h-[calc(var(--spacing)*12-2px)] after:bg-[radial-gradient(ellipse_at_top,var(--accent),rgba(255,255,255,0)_50%)] after:w-[calc(100%+calc(var(--spacing)*3)+13px)] first:after:rounded-l-3xl last:after:rounded-r-3xl after:opacity-0 data-[state=active]:after:opacity-50 after:transition-opacity after:duration-500 hover:after:opacity-25
                                data-[state=active]:shadow-none data-[state=active]:bg-background/0 dark:data-[state=active]:bg-background/0">
                        {variant === 'default' && item.label}
                        {variant === 'compact' && <item.icon />}
                    </TabsTrigger>
                ))}
            </TabsList>
        </Tabs>
    )
}
export default NavbarMenu;
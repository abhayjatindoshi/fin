import { Tabs, TabsList, TabsTrigger } from "@/modules/base-ui/components/ui/tabs";
import { useTenant } from "@/modules/data-sync/providers/TenantProvider";
import { ArrowRightLeft, FlaskConical, Home, PieChart } from "lucide-react";
import type { ComponentType } from "react";
import { useLocation, useNavigate } from "react-router-dom";

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
    { key: 'test', label: 'Test', url: '/test', icon: FlaskConical },
];

const NavbarMenu: React.FC<NavbarMenuProps> = ({ className, variant = 'default' }: NavbarMenuProps) => {

    const location = useLocation();
    const navigate = useNavigate();
    const { currentTenant } = useTenant();

    return (
        <Tabs value={location.pathname}>
            <TabsList className={`h-12 ${className}`}>
                {menu.map(item => (
                    <TabsTrigger value={`/${currentTenant?.id}${item.url}`} key={item.key} onClick={() => navigate('/' + currentTenant?.id + item.url)}
                        className="px-3 py-1 rounded-3xl text-base border-0 cursor-pointer relative
                                after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:block 
                                after:h-0.5 after:w-2 after:rounded-xl data-[state=active]:after:bg-accent/50 after:content-['']
                                data-[state=active]:after:shadow-[0_0_5px_5px] after:shadow-accent/30 data-[state=active]:shadow-none
                                data-[state=active]:bg-background/0 dark:data-[state=active]:bg-background/0">
                        {variant === 'default' && item.label}
                        {variant === 'compact' && <item.icon />}
                    </TabsTrigger>
                ))}
            </TabsList>
        </Tabs>
    )
}
export default NavbarMenu;
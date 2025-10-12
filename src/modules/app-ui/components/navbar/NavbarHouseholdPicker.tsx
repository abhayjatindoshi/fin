import { util } from "@/modules/app/entities/entities";
import type { Household } from "@/modules/app/entities/Household";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/modules/base-ui/components/ui/dropdown-menu";
import { useTenant } from "@/modules/data-sync/providers/TenantProvider";
import type { DateStrategyOptions } from "@/modules/data-sync/strategies/EntityKeyDateStrategy";
import { Check, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type NavbarHouseholdPickerProps = {
    className?: string
}

const NavbarHouseholdPicker: React.FC<NavbarHouseholdPickerProps> = ({ className }: NavbarHouseholdPickerProps) => {

    const location = useLocation();
    const navigate = useNavigate();
    const { currentTenant, manager } = useTenant<typeof util, DateStrategyOptions, Household>();
    const [tenants, setTenants] = useState<Household[]>(currentTenant ? [currentTenant] : []);

    useEffect(() => {
        if (!manager) return;
        const sub = manager.observeAll().subscribe(all => setTenants(all ?? []));
        return () => sub.unsubscribe();
    }, [manager]);

    const switchHousehold = (tenant: Household) => {
        if (!tenant || !tenant.id) return;
        if (currentTenant?.id === tenant.id) return;
        const newPath = location.pathname.split('/');
        if (newPath.length < 2) return;
        newPath[1] = tenant.id;
        navigate(newPath.join('/'));
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div className={`flex flex-row items-center gap-2 h-11 cursor-pointer ${className}`}>
                    {currentTenant?.name || 'No Household'}
                    <ChevronDown />
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-secondary/50 backdrop-blur-xs" align="start" sideOffset={10}>
                {tenants.map(tenant => (
                    <DropdownMenuItem key={tenant.id} className="flex flex-row justify-between" onClick={() => switchHousehold(tenant)}>
                        {tenant.name}
                        {currentTenant?.id === tenant.id && <Check />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default NavbarHouseholdPicker;
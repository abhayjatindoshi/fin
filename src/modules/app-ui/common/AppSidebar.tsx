import { Button } from "@/modules/base-ui/components/ui/button"
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/modules/base-ui/components/ui/sidebar"
import { useDataSync } from "@/modules/data-sync/DataSyncProvider"
import { ArrowRightLeft, ChevronsLeft, FlaskConical, Home, Import, PieChart, Settings } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import Logo from "./Logo"
import { ThemeSwitcher } from "./ThemeSwitcher"
import UserProfile from "./UserProfile"

// Menu items.
const items = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: Home,
    },
    {
        title: "Transactions",
        url: "/transactions",
        icon: ArrowRightLeft,
    },
    {
        title: "Budget",
        url: "/budget",
        icon: PieChart,
    },
    {
        title: "Import",
        url: "/import",
        icon: Import,
    },
    {
        title: "Settings",
        url: "/settings",
        icon: Settings,
    },
    {
        title: "Test",
        url: "/test",
        icon: FlaskConical,
    }
]

export function AppSidebar() {

    const { prefix } = useDataSync();
    const { state, toggleSidebar, isMobile } = useSidebar();
    const location = useLocation();

    if (!prefix) return <></>;

    return (
        <Sidebar collapsible="icon" className="border-sidebar">
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem key="logo">
                                {/* <SidebarMenuButton size="lg"> */}
                                <div className="flex flex-row items-center justify-between w-full" >
                                    {state == 'expanded' && <Logo />}
                                    {!isMobile && <Button variant="outline" size="icon-sm" className="p-0" onClick={toggleSidebar}>
                                        <ChevronsLeft className={`cursor-pointer transition-transform duration-300 ease-linear ${state == 'collapsed' ? 'rotate-180' : ''}`} />
                                    </Button>}
                                </div>
                                {/* </SidebarMenuButton> */}
                            </SidebarMenuItem>
                            {items.map((item) => {
                                const url = `/${prefix}${item.url}`;
                                return <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild isActive={location.pathname.endsWith(url)}>
                                        <Link to={url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="items-center">
                <ThemeSwitcher variant={state == 'expanded' ? "active-text" : "icon"} />
                <UserProfile />
            </SidebarFooter>
        </Sidebar >
    )
}
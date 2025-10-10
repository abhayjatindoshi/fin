import { SidebarProvider } from "@/modules/base-ui/components/ui/sidebar";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";

const BaseLayout: React.FC = () => {
    return <SidebarProvider defaultOpen={true}>
        <div className="w-screen h-screen flex flex-row">
            <AppSidebar />
            {/* <SidebarInset> */}
            <div className="flex-1 bg-sidebar p-2">
                <div className="rounded-xl bg-background min-h-full">
                    <Outlet />
                </div>
            </div>
            {/* </SidebarInset> */}
        </div>
    </SidebarProvider>;
};

export default BaseLayout;
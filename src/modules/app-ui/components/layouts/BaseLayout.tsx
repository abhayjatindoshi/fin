import { Outlet } from "react-router-dom";
import { useApp } from "../../providers/AppProvider";
import Navbar from "../navbar/Navbar";

const BaseLayout: React.FC = () => {

    const { isMobile } = useApp();

    if (isMobile) {
        return <div className="w-full">
            <div className="w-full pb-16">
                <Outlet />
            </div>
            <Navbar className="w-full px-2 absolute bottom-4 z-10" isMobile={true} />
        </div>
    } else {
        return <div className="flex flex-col mx-24 my-4 h-[calc(100%-2rem)]">
            <Navbar className="w-[calc(100%-12rem)] absolute top-4 z-10" />
            <div className="h-[calc(100%-4rem)] mt-16">
                <Outlet />
            </div>
        </div>
    }

};

export default BaseLayout;
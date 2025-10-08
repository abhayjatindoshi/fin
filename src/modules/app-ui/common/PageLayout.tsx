import { Button } from "@/modules/base-ui/components/ui/button";
import { Input } from "@/modules/base-ui/components/ui/input";
import { Separator } from "@/modules/base-ui/components/ui/separator";
import { SidebarTrigger, useSidebar } from "@/modules/base-ui/components/ui/sidebar";
import { Search } from "lucide-react";
import { useState } from "react";
import Logo from "./Logo";

interface PageLayoutProps {
    title?: string;
    children: React.ReactNode;
    className?: string;
    onSearch?: (text: string) => void;
}

const PageLayout: React.FC<PageLayoutProps> = ({ title, children, className, onSearch }: PageLayoutProps) => {

    document.title = title ? `Fin. | ${title}` : 'Fin.';

    const { isMobile } = useSidebar();
    const [searchText, setSearchText] = useState<string | null>(null);

    return (
        <div className="flex flex-col">
            <header className="flex flex-row h-16 shrink-0 items-center gap-2 border-b px-4">
                {isMobile && <>
                    <SidebarTrigger />
                    <Logo />
                    <Separator orientation="vertical" className="data-[orientation=vertical]:h-7" />
                </>}
                {title && <h1 className="text-2xl font-semibold">{title}</h1>}
                {searchText !== null &&
                    <Input className="w-0 ml-auto transition-all duration-300 ease-in-out focus:w-full" autoFocus type="text" placeholder="Search..." value={searchText} onChange={(e) => {
                        setSearchText(e.target.value);
                        if (onSearch) onSearch(e.target.value);
                    }} />}
                {onSearch && <Button variant="ghost" size="lg" className="ml-auto" onClick={() => setSearchText(searchText === null ? '' : null)}>
                    <Search />
                </Button>}
            </header>
            <div className={`overflow-auto p-4 ${className}`}>
                {children}
            </div>
        </div>
    );
}

export default PageLayout;
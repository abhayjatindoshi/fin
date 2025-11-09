import { useApp } from "@/modules/app-ui/providers/AppProvider";
import { Button } from "@/modules/base-ui/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/modules/base-ui/components/ui/input-group";
import { ArrowLeft, Search } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

type DetailsViewProps = {
    totalCount: number;
    filteredCount: number | undefined;
    setSearchTerm: (term: string) => void;
};
const DetailsView: React.FC<DetailsViewProps> = ({ totalCount, filteredCount, setSearchTerm }: DetailsViewProps) => {

    const { isMobile } = useApp();
    const { householdId, entityName } = useParams();
    const navigate = useNavigate();
    const [showSearch, setShowSearch] = useState<boolean>(isMobile ? false : true);

    return <div className="sticky w-full top-0 z-10 bg-background">
        <div className={`${isMobile ? 'px-1' : 'px-4'} py-1 gap-1 flex flex-row justify-between items-center`}>
            {isMobile && <div>
                <Button variant="ghost" size="icon-sm" onClick={() => navigate(`/${householdId}/dev/store`)}>
                    <ArrowLeft />
                </Button>
            </div>}
            <div>
                <h1 className="text-xl">{entityName}</h1>
                <span className="text-xs text-muted-foreground">{filteredCount !== undefined && filteredCount !== totalCount && `${filteredCount} / `}{totalCount} items</span>
            </div>
            <div className="grow"></div>
            <div className="mr-2">
                {isMobile && !showSearch && <Button variant="ghost" size="icon-sm" onClick={() => setShowSearch(true)}>
                    <Search />
                </Button>}
                {showSearch && <InputGroup className="mr-2">
                    <InputGroupInput autoFocus className="pr-2" size={10} placeholder="Search..."
                        onBlur={() => setShowSearch(isMobile ? false : true)}
                        onChange={e => setSearchTerm(e.target.value)} />
                    <InputGroupAddon>
                        <Search />
                    </InputGroupAddon>
                </InputGroup>}
            </div>
        </div>
    </div>
};

export default DetailsView;
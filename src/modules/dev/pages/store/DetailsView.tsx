import { InputGroup, InputGroupAddon, InputGroupInput } from "@/modules/base-ui/components/ui/input-group";
import type { Entity } from "@/modules/data-sync/entities/Entity";
import { Search } from "lucide-react";
import { useParams } from "react-router-dom";

type DetailsViewProps = {
    rows: Entity[];
};
const DetailsView: React.FC<DetailsViewProps> = ({ rows }) => {

    const { entityName } = useParams();

    return <div className="px-4 py-1 sticky top-0 z-10 bg-background backdrop-blur-lg">
        <div className="flex flex-row justify-between items-center">
            <div>
                <h1 className="text-xl">{entityName}</h1>
                <span className="text-xs text-muted-foreground">{rows.length} items</span>
            </div>
            <div>
                <InputGroup>
                    <InputGroupInput placeholder="Search..." />
                    <InputGroupAddon>
                        <Search />
                    </InputGroupAddon>
                </InputGroup>
            </div>
        </div>
    </div>
};

export default DetailsView;
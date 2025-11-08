import { useApp } from "@/modules/app-ui/providers/AppProvider";
import { EntityName } from "@/modules/app/entities/entities";
import { Button } from "@/modules/base-ui/components/ui/button";
import { Separator } from "@/modules/base-ui/components/ui/separator";
import { useRef } from "react";
import { Link, useParams } from "react-router-dom";

const EntityList: React.FC = () => {
    const entityNames = useRef(Object.keys(EntityName).sort());
    const { isMobile } = useApp();
    const { householdId, entityName } = useParams();

    return (
        <div className="flex flex-col">
            <h2 className={`text-xl font-semibold ${isMobile ? 'm-4' : 'm-2'}`}>Entities</h2>
            <Separator />
            <ul>
                {entityNames.current.map(name => (
                    <li key={name} className={isMobile ? "mx-4 my-2" : "m-2"}>
                        <Link to={`/${householdId}/dev/store/${name}`}>
                            <Button variant={entityName === name ? 'secondary' : 'link'} className="p-0 px-2 m-0">
                                {name}
                            </Button>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default EntityList;

import { Button } from "@/modules/base-ui/components/ui/button";
import type { Entity } from "@/modules/data-sync/entities/Entity";
import { X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

type JsonViewProps = {
    entity: Entity;
};

const JsonView: React.FC<JsonViewProps> = ({ entity }: JsonViewProps) => {

    const navigate = useNavigate();
    const { householdId, entityName } = useParams();

    return <div className="text-xs p-2 relative">
        <Button className="absolute top-0 right-0 m-2" variant="outline" size="icon-sm" onClick={() => navigate(`/${householdId}/dev/store/${entityName}`)}><X /></Button>
        <pre className="overflow-auto">{JSON.stringify(entity, null, 2)}</pre>
    </div>;
}

export default JsonView;
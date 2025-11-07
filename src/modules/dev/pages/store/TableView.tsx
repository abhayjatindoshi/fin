import { Spinner } from "@/modules/base-ui/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/modules/base-ui/components/ui/table";
import type { Entity } from "@/modules/data-sync/entities/Entity";
import { useNavigate, useParams } from "react-router-dom";

type TableViewProps = {
    rows: Entity[];
    loading: boolean;
};

const TableView: React.FC<TableViewProps> = ({ rows, loading }) => {

    const { householdId, entityName, entityId } = useParams();
    const navigate = useNavigate();

    if (loading) {
        return <div className="flex flex-col items-center justify-center h-full">
            <Spinner />
        </div>;
    }

    return <Table className="text-xs">
        <TableHeader className="sticky top-0 z-10 bg-background/70 backdrop-blur-lg">
            <TableRow className="border-b border-t">
                {Object.keys(rows[0] || {}).map(key => (
                    <TableHead key={key}>{key}</TableHead>
                ))}
            </TableRow>
        </TableHeader>
        <TableBody>
            {rows.map((row) => (
                <TableRow key={row.id}
                    data-state={entityId === row.id ? 'selected' : undefined}
                    onClick={() => navigate(`/${householdId}/dev/store/${entityName}/${row.id}`)}
                    className={`cursor-pointer`}>
                    {Object.values(row).map((value, colIndex) => (
                        <TableCell key={colIndex} className="max-w-80 truncate">{value + ''}</TableCell>
                    ))}
                </TableRow>
            ))}
        </TableBody>
    </Table>;
}

export default TableView;
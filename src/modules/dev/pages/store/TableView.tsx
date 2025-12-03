import { useApp } from "@/modules/app-ui/providers/AppProvider";
import { Spinner } from "@/modules/base-ui/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/modules/base-ui/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/modules/base-ui/components/ui/tooltip";
import type { Entity } from "@/modules/data-sync/entities/Entity";
import moment from "moment";
import { useNavigate, useParams } from "react-router-dom";

type TableViewProps = {
    rows: Entity[];
    loading: boolean;
};

const TableView: React.FC<TableViewProps> = ({ rows, loading }: TableViewProps) => {

    const { isMobile } = useApp();
    const { householdId, entityName, entityId } = useParams();
    const navigate = useNavigate();

    const firstKeys = ['id'];
    const lastKeys = ['createdAt', 'updatedAt', 'version'];
    const allKeys = [...firstKeys, ...Object.keys(rows[0] || {}).filter(key => !firstKeys.includes(key) && !lastKeys.includes(key)), ...lastKeys];

    if (loading) {
        return <div className="flex flex-col items-center justify-center h-full">
            <Spinner />
        </div>;
    }

    const Value = (row: Entity, key: string) => {
        const value = (row as Record<string, unknown>)[key];
        if (value instanceof Date) {
            return <Tooltip>
                <TooltipTrigger>{moment(value).fromNow()}</TooltipTrigger>
                <TooltipContent>{moment(value).format('MMMM Do YYYY, h:mm:ss a')}</TooltipContent>
            </Tooltip>
        } else if (value instanceof Object) {
            return <Tooltip>
                <TooltipTrigger className="truncate w-24">{JSON.stringify(value)}</TooltipTrigger>
                <TooltipContent><pre>{JSON.stringify(value, null, 2)}</pre></TooltipContent>
            </Tooltip>
        }
        return <>{String(value)}</>;
    }

    return <Table className="text-xs">
        <TableHeader className={`${isMobile ? '' : 'sticky top-0 z-10'} bg-background`}>
            <TableRow className="border-b border-t">
                {allKeys.map(key => (
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
                    {allKeys.map((key, colIndex) => (
                        <TableCell key={colIndex} className="max-w-80 truncate">{Value(row, key)}</TableCell>
                    ))}
                </TableRow>
            ))}
        </TableBody>
    </Table>;
}

export default TableView;
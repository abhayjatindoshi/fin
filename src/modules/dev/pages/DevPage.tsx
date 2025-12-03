import { Item, ItemContent, ItemHeader, ItemMedia } from "@/modules/base-ui/components/ui/item";
import { CloudCheck, Database, Import } from "lucide-react";
import { Link, useParams } from "react-router-dom";

const DevPage: React.FC = () => {

    const { householdId } = useParams();

    const menu = [
        { title: 'Data Sync', url: 'dev/data-sync', icon: <CloudCheck /> },
        { title: 'Import', url: 'dev/import', icon: <Import /> },
        { title: 'Store', url: 'dev/store', icon: <Database /> },
    ]

    return <div className="flex flex-row flex-wrap justify-center gap-4 w-full">
        {menu.map((item) => (
            <Link key={item.url} to={`/${householdId}/${item.url}`}>
                <Item variant="outline" className="bg-muted/50 shadow-muted shadow-md transition-all duration-300 ease-in-out
            hover:scale-105 hover:shadow-lg hover:-translate-y-1">
                    <ItemContent>
                        <ItemMedia>{item.icon}</ItemMedia>
                        <ItemHeader>{item.title}</ItemHeader>
                    </ItemContent>
                </Item>
            </Link>
        ))}
    </div>
};

export default DevPage;
import tags from "@/modules/app/common/FinalTags";
import BanksWidget from "../components/widgets/BanksWidget";
import ImportWidget from "../components/widgets/ImportWidget";
import MoneyFlowWidget from "../components/widgets/MoneyFlowWidget";
import { TagIconComponent } from "../icons/tags/TagIcons";
import { useApp } from "../providers/AppProvider";

const HomePage: React.FC = () => {

    const { isMobile } = useApp();

    return <>
        <div className={`flex gap-4 ${isMobile ? 'flex-col p-4' : 'items-center flex-row flex-wrap'}`}>
            <ImportWidget />
            <BanksWidget />
            <MoneyFlowWidget />
        </div>
        <div className="flex flex-col gap-2">
            {Object.entries(tags).map(([tagName, tagData]) => (
                <div key={tagName} className="px-4 py-2 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-row gap-2">
                        <TagIconComponent name={tagData.icon || ''} />
                        <div className="font-semibold">{tagName}</div>
                    </div>
                    {tagData.description && <div className="text-sm text-muted-foreground mt-1">{tagData.description}</div>}
                    {tagData.children && <div className="flex flex-row gap-2 flex-wrap mt-2">
                        {Object.entries(tagData.children).map(([childTagName, childTagData]) => (
                            <div key={childTagName} className="flex flex-row gap-1 items-center p-2 border rounded-md text-sm hover:bg-muted/50 transition-colors">
                                <TagIconComponent name={childTagData.icon || ''} className="size-6" />
                                <div>{childTagName}</div>
                            </div>
                        ))}
                    </div>}
                </div>))}
        </div>
        <div className={`-z-10 fixed text-right text-muted-foreground font-black opacity-30 ${isMobile ? 'text-8xl bottom-10 right-10' : 'w-1/2 text-9xl bottom-0 right-2'}`}>
            More widgets coming soon...
        </div>
    </>;
}

export default HomePage;
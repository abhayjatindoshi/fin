import { useState } from "react";
import PageLayout from "../common/PageLayout";
import EmptyGallery from "./EmptyGallery";

const Dashboard: React.FC = () => {

    const [searchText, setSearchText] = useState<string | null>(null);

    const search = (text: string) => {
        setSearchText(text);
    }

    //     className=" glass h-40 w-120 rounded-lg flex items-center justify-center "> // 
    const Block = () => {
        return <div
            className=" border-2 border-foreground/5 glass h-20 w-50 bg-secondary/30 rounded-lg flex items-center justify-center ">
            Block
        </div>
    }

    return <PageLayout onSearch={search} className="flex flex-col">
        <div className="p-4">Dashboard Page {searchText}</div>
        <div className="flex flex-row justify-center gap-4 flex-wrap">
            <Block />
            <Block />
            <Block />
            <Block />
        </div>
        <EmptyGallery />
        <EmptyGallery />
        <EmptyGallery />
        <EmptyGallery />
        <EmptyGallery />
    </PageLayout>
};

export default Dashboard;
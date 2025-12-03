import { TagIconComponent } from "@/modules/app-ui/icons/tags/TagIcons";
import { useEntity } from "@/modules/app-ui/providers/EntityProvider";
import { Button } from "@/modules/base-ui/components/ui/button";
import { Hash } from "lucide-react";

type TagCellProps = {
    tagId: string | null;
    onClick?: (event: React.MouseEvent<HTMLElement>) => void;
    className?: string;
};

const TagCell: React.FC<TagCellProps> = ({ tagId, onClick, className }) => {

    const { tagMap } = useEntity();
    const tag = tagId && tagMap ? tagMap[tagId] : null;

    return (
        <Button variant="secondary" size="sm" className={`m-0 cursor-pointer ${className}`} onClick={onClick}>
            {tag != null ?
                <>
                    <TagIconComponent name={tag.icon} />
                    <span>{tag.name}</span>
                </> :
                <>
                    <Hash className="text-muted-foreground" />
                    <span className="text-muted-foreground">Add Tag</span>
                </>
            }
        </Button>
    );
};

export default TagCell;

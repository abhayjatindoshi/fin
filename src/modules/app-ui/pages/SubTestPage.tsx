import { EntityName } from "@/modules/app/entities/entities"
import type { Tag } from "@/modules/app/entities/Tag"
import { withSyncAndParams } from "@/modules/data-sync/ui/SyncedComponent"
import type { PropsWithChildren } from "react"

type SubTestPageProps = PropsWithChildren<{
    tag: Tag | undefined
}>

const SubTestPage: React.FC<SubTestPageProps> = ({ tag }: SubTestPageProps) => {
    return <div>
        <h3>Sub Test Page</h3>
        <p>Tag: {tag?.name} (ID: {tag?.id})</p>
    </div>
}

const synced = withSyncAndParams(
    (orchestrator, params) => {
        const repo = orchestrator.repo(EntityName.Tag);
        const tag = repo.observe(params.tagId ?? '');
        return { tag };
    },
    SubTestPage
);

export default synced;
import { SystemTags } from "../common/SystemTags";
import { EntityName } from "../entities/entities";
import type { Tag } from "../entities/Tag";
import { BaseService } from "./BaseService";

export type TagWithChildren = Tag & {
    children: TagWithChildren[];
}

export class TaggingService extends BaseService {

    async getTagsWithHierarchy(): Promise<Record<string, TagWithChildren>> {
        const tagMap: Record<string, TagWithChildren> = {};

        Object.values(SystemTags).forEach((tag) => {
            if (!tag.id) return;
            tagMap[tag.id] = { ...tag, children: [] };
        });

        (await this.repository(EntityName.Tag).getAll() as Tag[]).forEach((tag) => {
            if (!tag.id) return;
            tagMap[tag.id] = { ...tag, children: [] };
        });

        Object.values(tagMap).forEach((tag) => {
            if (tag.parent && tagMap[tag.parent]) {
                tagMap[tag.parent].children.push(tag);
            }
        });

        return tagMap;
    }
}

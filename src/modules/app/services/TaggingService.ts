import { map, type Observable } from "rxjs";
import { SystemTags } from "../common/SystemTags";
import { EntityName } from "../entities/entities";
import type { Tag } from "../entities/Tag";
import { BaseService } from "./BaseService";

export type EnhancedTag = Tag & {
    searchWords: string[];
    children: EnhancedTag[];
}

export class TaggingService extends BaseService {

    private static getSearchWords = (tag: Tag): string[] => {
        const searchPath = tag.name.replace(/[^\w]/g, " ") +
            " " + (tag.description ? tag.description.replace(/[^\w]/g, " ") : "");

        return [...new Set(searchPath.toLowerCase().split(" ").filter(w => w.trim() !== ""))];
    }

    private static convertToEnhancedTagMap = (tags: Tag[], refMap?: Record<string, EnhancedTag>): Record<string, EnhancedTag> => {
        const enhancedTagMap: Record<string, EnhancedTag> = {};
        tags.forEach(tag => {
            if (!tag.id) return;
            enhancedTagMap[tag.id] = {
                ...tag,
                searchWords: TaggingService.getSearchWords(tag),
                children: []
            };
        });

        Object.values(enhancedTagMap).forEach(tag => {
            if (tag.parent && enhancedTagMap[tag.parent]) {
                enhancedTagMap[tag.parent].children.push(tag);
            } else if (tag.parent && refMap && refMap[tag.parent]) {
                refMap[tag.parent].children.push(tag);
            }
        });

        return { ...enhancedTagMap, ...refMap };
    }

    private static systemTagMap: Record<string, EnhancedTag> = TaggingService.convertToEnhancedTagMap(Object.values(SystemTags));

    observeTagMap(): Observable<Record<string, EnhancedTag>> {
        const tagRepo = this.repository(EntityName.Tag);

        return tagRepo.observeAll().pipe(
            map((tags) => TaggingService.convertToEnhancedTagMap(tags as Tag[], TaggingService.systemTagMap))
        );
    }

    async getTagsWithHierarchy(): Promise<Record<string, EnhancedTag>> {
        const tagMap: Record<string, EnhancedTag> = {};

        Object.values(SystemTags).forEach((tag) => {
            if (!tag.id) return;
            tagMap[tag.id] = { ...tag, children: [], searchWords: [] };
        });

        (await this.repository(EntityName.Tag).getAll() as Tag[]).forEach((tag) => {
            if (!tag.id) return;
            tagMap[tag.id] = { ...tag, children: [], searchWords: [] };
        });

        Object.values(tagMap).forEach((tag) => {
            if (tag.parent && tagMap[tag.parent]) {
                tagMap[tag.parent].children.push(tag);
            }
        });

        return tagMap;
    }

}

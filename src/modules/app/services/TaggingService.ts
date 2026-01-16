import { ImportMatrix } from "@/modules/import/ImportMatrix";
import { combineLatest, map, type Observable } from "rxjs";
import { SystemTags } from "../common/SystemTags";
import { EntityName } from "../entities/entities";
import type { MoneyAccount } from "../entities/MoneyAccount";
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

        const tagMap = { ...enhancedTagMap, ...refMap };
        Object.values(tagMap).forEach(tag => {
            tag.children = Object.values(tag.children.reduce((acc, child) => {
                acc[child.id!] = child;
                return acc;
            }, {} as Record<string, EnhancedTag>));
        });
        return tagMap;
    }

    private static systemTagMap: Record<string, EnhancedTag> = TaggingService.convertToEnhancedTagMap(Object.values(SystemTags));

    observeTagMap(): Observable<Record<string, EnhancedTag>> {
        const tagRepo = this.repository(EntityName.Tag);
        const accountRepo = this.repository(EntityName.MoneyAccount);

        return combineLatest([
            tagRepo.observeAll(),
            accountRepo.observeAll()
        ]).pipe(
            map(([tags, accounts]) => {
                if (!tags || !accounts) return {};
                const allTags = [
                    ...tags as Tag[],
                    ...(accounts as MoneyAccount[]).map(account => {
                        const accountNumber = account.accountNumber.slice(-4);
                        const name = `****${accountNumber}`;
                        const bank = ImportMatrix.Banks[account.bankId];
                        const offering = bank?.offerings.find(o => o.id === account.offeringId);
                        const id = `account-${bank.id}-${offering?.id}-${accountNumber}`;
                        const icon = offering?.display.icon || bank.display?.icon;
                        return {
                            id: id,
                            name: name,
                            icon: icon ? 'account-' + icon : 'landmark',
                            parent: 'system-tag-selftransfer',
                        } as Tag
                    })
                ]
                return TaggingService.convertToEnhancedTagMap(allTags, TaggingService.systemTagMap);
            })
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

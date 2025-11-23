import { SystemTags } from "@/modules/app/common/SystemTags";
import { EntityName } from "@/modules/app/entities/entities";
import type { MoneyAccount } from "@/modules/app/entities/MoneyAccount";
import type { Tag } from "@/modules/app/entities/Tag";
import { ImportHandler } from "@/modules/app/import/ImportHandler";
import type { IImportAdapter } from "@/modules/app/import/interfaces/IImportAdapter";
import { useDataSync } from "@/modules/data-sync/providers/DataSyncProvider";
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";

export type EnhancedTag = Tag & {
    searchWords: string[];
    children: EnhancedTag[];
}

interface EntityContextProps {
    accountMap?: Record<string, MoneyAccount>;
    adapterMap?: Record<string, IImportAdapter>;
    tagMap?: Record<string, EnhancedTag>;
}

const EntityContext = createContext<EntityContextProps>({});

const getSearchWords = (tag: Tag): string[] => {
    const searchPath = tag.name.replace(/[^\w]/g, " ") +
        " " + (tag.description ? tag.description.replace(/[^\w]/g, " ") : "");

    return [...new Set(searchPath.toLowerCase().split(" ").filter(w => w.trim() !== ""))];
}


const convertToEnhancedTagMap = (tags: Tag[], refMap?: Record<string, EnhancedTag>): Record<string, EnhancedTag> => {
    const enhancedTagMap: Record<string, EnhancedTag> = {};
    tags.forEach(tag => {
        if (!tag.id) return;
        enhancedTagMap[tag.id] = {
            ...tag,
            searchWords: getSearchWords(tag),
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

export const EntityProvider: React.FC<PropsWithChildren> = ({ children }: PropsWithChildren<EntityContextProps>) => {

    const { orchestrator } = useDataSync();

    const [accountMap, setAccountMap] = useState<Record<string, MoneyAccount>>({});
    const [tagMap, setTagMap] = useState<Record<string, EnhancedTag>>({});

    const adapterMap = useMemo(() => ImportHandler.getAllAdapterMeta(), []);
    const systemTagMap = useMemo(() => convertToEnhancedTagMap(Object.values(SystemTags)), []);

    useEffect(() => {
        if (!orchestrator) return;

        const accountRepo = orchestrator.repo(EntityName.MoneyAccount);
        const tagRepo = orchestrator.repo(EntityName.Tag);

        const subscriptions = [
            accountRepo.observeAll().subscribe(accounts => {
                setAccountMap((accounts as MoneyAccount[]).reduce((map, acc) => {
                    if (!acc.id) return map;
                    map[acc.id] = acc;
                    return map;
                }, {} as Record<string, MoneyAccount>));
            }),
            tagRepo.observeAll().subscribe(customTags => {
                setTagMap(convertToEnhancedTagMap(customTags as Tag[], systemTagMap));
            }),
        ]

        return () => subscriptions.forEach(sub => sub.unsubscribe());

    }, [orchestrator]);

    return (
        <EntityContext.Provider value={{ accountMap, adapterMap, tagMap }}>
            {children}
        </EntityContext.Provider>
    )
}

export const useEntity = () => {
    const context = useContext(EntityContext);
    if (!context) {
        throw new Error("useEntity must be used within an EntityProvider");
    }
    return context;
}
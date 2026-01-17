import { EntityName } from "@/modules/app/entities/entities";
import type { MoneyAccount } from "@/modules/app/entities/MoneyAccount";
import type { Tag } from "@/modules/app/entities/Tag";
import { TaggingService } from "@/modules/app/services/TaggingService";
import { useDataSync } from "@/modules/data-sync/providers/DataSyncProvider";
import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren } from "react";
import { toRecord, unsubscribeAll } from "../common/ComponentUtils";
import { setupWindow } from "../import";

export type EnhancedTag = Tag & {
    searchWords: string[];
    children: EnhancedTag[];
}

interface EntityContextProps {
    accountMap?: Record<string, MoneyAccount>;
    tagMap?: Record<string, EnhancedTag>;
}

export type WindowTags = Window & {
    tags: Record<string, Tag>;
}

const EntityContext = createContext<EntityContextProps>({});

export const EntityProvider: React.FC<PropsWithChildren> = ({ children }: PropsWithChildren<EntityContextProps>) => {

    const { orchestrator } = useDataSync();

    const taggingService = useRef(new TaggingService());
    const [accountMap, setAccountMap] = useState<Record<string, MoneyAccount>>({});
    const [tagMap, setTagMap] = useState<Record<string, EnhancedTag>>({});

    useEffect(() => {
        if (!orchestrator) return;

        const accountRepo = orchestrator.repo(EntityName.MoneyAccount);

        const subscriptions = [
            accountRepo.observeAll().subscribe(accounts => {
                setAccountMap(toRecord(accounts as MoneyAccount[], 'id'));
            }),
            taggingService.current.observeTagMap().subscribe((tags) => {
                setupWindow();
                (window as WindowTags).tags = tags;
                setTagMap(tags);
            })
        ]

        return unsubscribeAll(...subscriptions);

    }, [orchestrator]);

    return (
        <EntityContext.Provider value={{ accountMap, tagMap }}>
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
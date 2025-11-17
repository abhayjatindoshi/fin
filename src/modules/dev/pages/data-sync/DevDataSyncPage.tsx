import { Card, CardContent, CardTitle } from "@/modules/base-ui/components/ui/card";
import { Separator } from "@/modules/base-ui/components/ui/separator";
import { Spinner } from "@/modules/base-ui/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/modules/base-ui/components/ui/tooltip";
import type { Metadata } from "@/modules/data-sync/entities/Metadata";
import { useDataSync } from "@/modules/data-sync/providers/DataSyncProvider";
import { Calendar, Database, Hash, Trash2 } from "lucide-react";
import moment from "moment";
import type React from "react";
import { useEffect, useState } from "react";

const DevDataSyncPage: React.FC = () => {

    const { orchestrator } = useDataSync();
    const [storeMetadata, setStoreMetadata] = useState<Metadata | null>(null);
    const [localMetadata, setLocalMetadata] = useState<Metadata | null>(null);
    const [cloudMetadata, setCloudMetadata] = useState<Metadata | null>(null);
    const [selectedEntityKey, setSelectedEntityKey] = useState<string | null>(null);

    useEffect(() => {
        if (!orchestrator) return;

        const metadataManager = orchestrator.ctx.metadataManager;
        metadataManager.getStoreMetadata().then(setStoreMetadata);
        metadataManager.getLocalMetadata().then(setLocalMetadata);
        metadataManager.getCloudMetadata().then(setCloudMetadata);
    }, [orchestrator]);


    const MetadataUI = ({ title, metadata }: { title: string; metadata: Metadata | null }) => {
        if (!metadata) return <Spinner />;

        const sortedEntityKeys = Object.entries(metadata.entityKeys)
            .sort(([aKey], [bKey]) => -aKey.localeCompare(bKey))
            .map(([key, value]) => ({ key, ...value }));

        return <div className="flex flex-col gap-2">
            <div className="flex flex-col items-start">
                <span className="text-xl">{title}</span>
                <Tooltip>
                    <TooltipTrigger>
                        <span className="text-muted-foreground text-sm">Last updated {moment(metadata.updatedAt).fromNow()}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                        <span>{moment(metadata.updatedAt).format('MMM Do YYYY, h:mm:ss a')}</span>
                    </TooltipContent>
                </Tooltip>
            </div>
            <div className="flex flex-row flex-wrap gap-2 transition-all ease-in duration-200">
                {sortedEntityKeys.map(entityKey => (
                    <div key={entityKey.key}
                        onClick={() => setSelectedEntityKey(selectedEntityKey == entityKey.key ? null : entityKey.key)}
                        className={`flex flex-col items-start p-2 rounded-xl hover:shadow-2xl shadow-muted
                            border bg-muted/20 backdrop-blur-md cursor-pointer 
                            ${selectedEntityKey === entityKey.key && 'basis-full'}`}>
                        <span className="font-semibold">{entityKey.key}</span>
                        {selectedEntityKey !== entityKey.key && <span className="text-muted-foreground text-xs">
                            {moment(entityKey.updatedAt).fromNow()}
                        </span>}
                        {selectedEntityKey === entityKey.key && (
                            <div className="mt-4 flex flex-col gap-2">
                                <div className="flex flex-row gap-2">
                                    <Hash />
                                    <span>{entityKey.hash}</span>
                                </div>
                                <div className="flex flex-row gap-2">
                                    <Calendar />
                                    <span>{moment(entityKey.updatedAt).format('MMM Do YYYY, h:mm:ss a')}</span>
                                </div>
                                <div className="flex flex-row flex-wrap gap-2">
                                    {Object.entries(entityKey.entities).map(([name, value]) => (
                                        <Card key={name} className="p-0">
                                            <CardContent className="p-0">
                                                <CardTitle className="m-3">{name}</CardTitle>
                                                <Separator />
                                                <div className="flex flex-row flex-wrap m-2 gap-2">
                                                    {value.count > 0 && <div className="flex flex-row gap-2">
                                                        <Database />
                                                        <span>{value.count}</span>
                                                    </div>}
                                                    {value.deletedCount > 0 && <div className="flex flex-row gap-2">
                                                        <Trash2 />
                                                        <span>{value.deletedCount}</span>
                                                    </div>}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {/* <pre>{JSON.stringify(metadata, null, 2)}</pre> */}
        </div >;
    }

    return <div className="flex flex-row gap-4 p-4">
        <MetadataUI title="Store" metadata={storeMetadata} />
        <MetadataUI title="Local" metadata={localMetadata} />
        <MetadataUI title="Cloud" metadata={cloudMetadata} />
    </div>;
}

export default DevDataSyncPage;
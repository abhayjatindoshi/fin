import { Button } from "@/modules/base-ui/components/ui/button";
import { Item, ItemContent, ItemDescription, ItemFooter, ItemMedia, ItemTitle } from "@/modules/base-ui/components/ui/item";
import { Popover, PopoverContent, PopoverTrigger } from "@/modules/base-ui/components/ui/popover";
import { useDataSync } from "@/modules/data-sync/providers/DataSyncProvider";
import { CircleDashed, CloudCheck, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

const SyncStatus: React.FC = () => {

    const { orchestrator } = useDataSync();
    const [hasChanges, setHasChanges] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!orchestrator) return;
        const subscription = orchestrator.observeDirty().subscribe(dirty => {
            setHasChanges(dirty);
        });
        return () => subscription.unsubscribe();
    }, [orchestrator]);

    const saveChanges = () => {
        if (!orchestrator) return;
        setSaving(true);
        orchestrator.syncNow()
            .finally(() => setSaving(false));
    }

    const icon = saving ? <RefreshCw className="animate-spin" /> : (hasChanges ? <CircleDashed /> : <CloudCheck />);

    return (
        <div>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon-sm">
                        {icon}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-110 p-0">
                    <Item variant="default">
                        <ItemMedia variant="icon">
                            {icon}
                        </ItemMedia>
                        <ItemContent>
                            {hasChanges ? <>
                                <ItemTitle>You have unsaved changes.</ItemTitle>
                                <ItemDescription>Your changes are saved automatically. You can save the changes immediately by clicking the save button.</ItemDescription>
                            </> : <>
                                <ItemTitle>All changes are synced.</ItemTitle>
                                <ItemDescription>Your changes are saved automatically.</ItemDescription>
                            </>}
                        </ItemContent>
                        {hasChanges && <ItemFooter>
                            <Button onClick={saveChanges} disabled={saving}>
                                {saving ? "Saving..." : "Save now"}
                            </Button>
                        </ItemFooter>}
                    </Item>
                </PopoverContent>
            </Popover>
        </div>
    );
};

export default SyncStatus;
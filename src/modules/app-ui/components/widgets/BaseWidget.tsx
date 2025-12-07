import { Button } from "@/modules/base-ui/components/ui/button";
import { Cog, Scaling, X } from "lucide-react";
import { useRef, useState } from "react";

type WidgetComponentProps = {
    ref?: React.Ref<HTMLDivElement>;
}

type BaseWidgetProps = {
    WidgetSettings?: React.FC;
    WidgetComponent: React.FC<WidgetComponentProps>;
    defaultSize?: { width: number; height: number };
    resizeable?: boolean;
}

// https://master--5fc05e08a4a65d0021ae0bf2.chromatic.com/?path=/story/core-draggable-hooks-usedraggable--snap-center-to-cursor

const BaseWidget: React.FC<BaseWidgetProps> = ({
    WidgetSettings, WidgetComponent,
    defaultSize = { width: 200, height: 200 },
    resizeable
}) => {
    const [showSettings, setShowSettings] = useState<boolean>(false);
    const [size, setSize] = useState<{ width: number; height: number }>(defaultSize);
    const componentRef = useRef<HTMLDivElement>(null);

    const onBlur = () => {
        if (showSettings) {
            setShowSettings(false);
        }
    };

    return <div className="group flex flex-row gap-1" onBlur={onBlur}>
        <div className="rounded-lg border backdrop-blur-lg bg-muted/30 flex items-center" style={{ width: size.width, height: size.height }}>
            {WidgetSettings && showSettings ?
                <WidgetSettings /> :
                <WidgetComponent ref={componentRef} />
            }
        </div>
        <div className="group-hover:flex hidden flex-col gap-1 items-center">
            {WidgetSettings && <Button size="icon-sm" variant="outline" onClick={() => setShowSettings(!showSettings)}>
                {showSettings ? <X /> : <Cog />}
            </Button>}
            {resizeable && <Button size="icon-sm" variant="outline">
                <Scaling />
            </Button>}
        </div>
    </div>;
}

export default BaseWidget;
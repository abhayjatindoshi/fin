import { Button } from "@/modules/base-ui/components/ui/button";
import { Cog, Scaling, X } from "lucide-react";
import { useRef, useState } from "react";
import { ResizableBox } from "react-resizable";

type WidgetComponentProps = {
    ref?: React.Ref<HTMLDivElement>;
}

type SizeProps = {
    width: number;
    height: number;
}

type WidgetSizeProps = {
    default: SizeProps;
    min: SizeProps;
    max: SizeProps;
}

type BaseWidgetProps = {
    WidgetSettings?: React.FC;
    WidgetComponent: React.FC<WidgetComponentProps>;
    size?: Partial<WidgetSizeProps>;
    resizeable?: boolean;
}

// https://master--5fc05e08a4a65d0021ae0bf2.chromatic.com/?path=/story/core-draggable-hooks-usedraggable--snap-center-to-cursor

const remFactor = 16;

const setDefaults = (size?: Partial<WidgetSizeProps>): WidgetSizeProps => {
    if (!size) {
        return {
            default: { width: 8, height: 6 },
            min: { width: 2, height: 2 },
            max: { width: 20, height: 20 },
        };
    }
    if (!size.default) {
        size.default = { width: 8, height: 6 };
    }
    if (!size.min) {
        size.min = { width: 2, height: 2 };
    }
    if (!size.max) {
        size.max = { width: 20, height: 20 };
    }
    return size as WidgetSizeProps;
}

const BaseWidget: React.FC<BaseWidgetProps> = ({
    WidgetSettings, WidgetComponent,
    size,
    resizeable
}) => {
    const [showSettings, setShowSettings] = useState<boolean>(false);
    const [showResizeHandle, setShowResizeHandle] = useState<boolean>(false);
    const componentRef = useRef<HTMLDivElement>(null);

    const onBlur = () => {
        if (showSettings) {
            setShowSettings(false);
        }
    };

    const widgetSize = setDefaults(size);

    const ResizeHandle: React.FC<{ enabled: boolean, handleAxis: string, ref: React.Ref<HTMLDivElement> }> = ({ enabled, handleAxis, ref }) => {
        return <div
            ref={ref}
            className={`
                custom-handle custom-handle-${handleAxis} custom-resize-handle-component
                absolute bottom-0 right-0 w-4 h-4 bg-gray-500 
                ${enabled ? "block" : "hidden"}`}
        />
    }

    return <div className="group flex flex-row gap-1" onBlur={onBlur}>
        <ResizableBox
            width={widgetSize.default.width * remFactor}
            height={widgetSize.default.height * remFactor}
            draggableOpts={{ grid: [0.5 * remFactor, 0.5 * remFactor] }}
            minConstraints={[widgetSize.min.width * remFactor, widgetSize.min.height * remFactor]}
            maxConstraints={[widgetSize.max.width * remFactor, widgetSize.max.height * remFactor]}
            handle={(axis, ref) => <ResizeHandle enabled={showResizeHandle} handleAxis={axis} ref={ref} />}
            className="rounded-lg border backdrop-blur-lg bg-muted/30 flex items-center justify-center">
            {WidgetSettings && showSettings ?
                <WidgetSettings /> :
                <WidgetComponent ref={componentRef} />
            }
        </ResizableBox>
        <div className="group-hover:flex hidden flex-col gap-1 items-center">
            {WidgetSettings && <Button size="icon-sm" variant="outline" onClick={() => setShowSettings(!showSettings)}>
                {showSettings ? <X /> : <Cog />}
            </Button>}
            {resizeable && <Button size="icon-sm" variant="outline" onClick={() => setShowResizeHandle(!showResizeHandle)}>
                <Scaling />
            </Button>}
        </div>
    </div>;
}

export default BaseWidget;
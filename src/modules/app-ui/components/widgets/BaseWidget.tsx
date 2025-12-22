import { Button } from "@/modules/base-ui/components/ui/button";
import { Cog, X } from "lucide-react";
import { useRef, useState } from "react";
import ResponsiveDialog from "../../common/ResponsiveDialog";

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

// const remFactor = 16;
// const defaultSize: WidgetSizeProps = {
//     default: { width: 8, height: 6 },
//     min: { width: 2, height: 2 },
//     max: { width: 20, height: 20 },
// };
// 
// const setDefaults = (size?: Partial<WidgetSizeProps>): WidgetSizeProps => {
//     size = size || defaultSize;
//     size.default = size.default || defaultSize.default;
//     size.min = size.min || defaultSize.min;
//     return size as WidgetSizeProps;
// }

const BaseWidget: React.FC<BaseWidgetProps> = ({
    WidgetSettings, WidgetComponent,
    // size,
    // resizeable
}) => {
    const [showSettings, setShowSettings] = useState<boolean>(false);
    const componentRef = useRef<HTMLDivElement>(null);

    // const widgetSize = setDefaults(size);

    return <div className="group flex flex-row gap-1">
        {/* <ResizableBox
            width={widgetSize.default.width * remFactor}
            height={widgetSize.default.height * remFactor}
            draggableOpts={{ grid: [0.5 * remFactor, 0.5 * remFactor] }}
            minConstraints={[widgetSize.min.width * remFactor, widgetSize.min.height * remFactor]}
            maxConstraints={widgetSize.max && [widgetSize.max.width * remFactor, widgetSize.max.height * remFactor]}
            resizeHandles={resizeable ? ["se"] : []} */}
        <div className="rounded-lg border backdrop-blur-lg bg-muted/30 flex items-center justify-center p-4 w-full">
            <WidgetComponent ref={componentRef} />
        </div>
        {WidgetSettings && <>
            <div className="group-hover:flex hidden flex-col gap-1 items-center">
                <Button size="icon-sm" variant="outline" onClick={() => setShowSettings(!showSettings)}>
                    {showSettings ? <X /> : <Cog />}
                </Button>
            </div>
            <ResponsiveDialog
                open={showSettings}
                onOpenChange={setShowSettings}
                title="Settings"
            ><WidgetSettings /></ResponsiveDialog>
        </>}
    </div>;
}

export default BaseWidget;
import { ChartContainer } from "@/modules/base-ui/components/ui/chart";
import { useEffect, useRef, useState, type PropsWithChildren } from "react";
import { Pie, PieChart } from "recharts";

type RadialProgressChartProps = {
    value: number;
    maxValue: number;
    progressWidth?: number;
    color?: string;
    className?: string;
};

const FinRadialProgressChart: React.FC<PropsWithChildren<RadialProgressChartProps>> = ({
    value, maxValue,
    progressWidth = 8,
    color = 'var(--color-accent)',
    className,
    children
}) => {

    const elementRef = useRef<HTMLDivElement>(null);
    const degrees = value / maxValue * 360;
    const [innerRadius, setInnerRadius] = useState<number>(100);

    useEffect(() => {
        if (!elementRef.current) return;
        const totalWidth = elementRef.current.clientWidth;
        setInnerRadius(((totalWidth - progressWidth * 2) / totalWidth) * 100);
    }, [elementRef])

    return <div ref={elementRef} className={`relative aspect-square ${className}`}>
        <div className="flex items-center justify-center">{children}</div>
        <ChartContainer className="absolute inset-0 w-full h-full" config={{}}>
            <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <Pie
                    data={[{ value: 1 }]}
                    dataKey="value"
                    outerRadius='100%'
                    innerRadius={`${innerRadius}%`}
                    cornerRadius='100%'
                    fill={color}
                    startAngle={90}
                    endAngle={90 - degrees}

                />
            </PieChart>
        </ChartContainer>
        <div className="absolute inset-0 w-full h-full border rounded-full -z-10" style={{ borderWidth: progressWidth }} />
    </div>;
}

export default FinRadialProgressChart;
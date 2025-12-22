import { ChartContainer } from "@/modules/base-ui/components/ui/chart";
import { Area, AreaChart } from "recharts";
import type { CurveType } from "recharts/types/shape/Curve";

type FinAreaChartProps = {
    values: Array<number>;
    color?: string;
    gradient?: boolean;
    curveType?: CurveType;
    className?: string;
    chartClassName?: string;
};

const FinAreaChart: React.FC<FinAreaChartProps> = ({
    values,
    color = 'var(--color-accent)',
    gradient = false,
    curveType = 'natural',
    className, chartClassName
}) => {
    const data = values.map(v => ({ value: v }));

    return <ChartContainer className={`w-full h-full ${className}`} config={{}}>
        <AreaChart
            className={chartClassName}
            data={data}
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
        >
            <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
            </defs>
            <Area type={curveType} fill={gradient ? "url(#colorGradient)" : color} dataKey="value" />
        </AreaChart>
    </ChartContainer>;
}

export default FinAreaChart;
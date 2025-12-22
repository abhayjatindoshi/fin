import * as ProgressPrimitive from "@radix-ui/react-progress";
import * as React from "react";

import { cn } from "@/modules/base-ui/lib/utils";

function colors(value: number): [string, string, string] {
  if (value > 110) return ["var(--color-red-800)", "var(--color-stone-950)", "text-white"];
  else if (value > 95) return ["var(--color-red-500)", "var(--color-red-900)", "text-white"];
  else if (value > 80) return ["var(--color-orange-400)", "var(--color-red-500)", "text-white"];
  else if (value > 60) return ["var(--color-yellow-400)", "var(--color-orange-500)", "text-foreground"];
  else if (value > 40) return ["var(--color-green-400)", "var(--color-yellow-500)", "text-foreground"];
  else return ["var(--color-teal-500)", "var(--color-green-500)", "text-foreground"];
}

function SemanticProgress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {

  const [baseColor, gradientColor, textClass] = colors(value || 0);

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "bg-muted/50 relative h-6 w-full overflow-hidden rounded-full border backdrop-blur-xs",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          "h-full flex-1 rounded-full animate-scale-in"
        )}
        style={{
          width: `${value}%`,
          background: `linear-gradient(90deg, ${baseColor} 0%, ${gradientColor} 100%)`,
        }}
      >
      </ProgressPrimitive.Indicator>
      {value != undefined && value < 100 && <div
        className="absolute inset-3 w-6 h-6 rounded-full border bg-muted animate-pulse delay-1000"
        style={{
          background: `radial-gradient(circle, #fff9 0%, ${baseColor} 60%, ${gradientColor} 100%)`,
          boxShadow: `0 0 24px 6px ${baseColor}, 0 0 48px 12px ${gradientColor}`,
          left: `calc(${value}% - 1rem)`,
          transition: 'left 0.5s cubic-bezier(.4,2,.6,1)',
        }}
      />}
      <div className={`absolute inset-0 flex items-center justify-center font-semibold ${textClass}`}>{value?.toFixed(0)}%</div>
    </ProgressPrimitive.Root>
  )
}

export { SemanticProgress };


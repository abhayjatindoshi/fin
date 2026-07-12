import { cn } from "@/lib/utils"
import type { RenderHeaderArgs } from "./transaction-virtualizer"

const MONTH_FMT = new Intl.DateTimeFormat(undefined, {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
})

export type MonthHeaderProps = RenderHeaderArgs

/**
 * Sticky section header for a month group. When `active` (pinned at the top of
 * the scroll viewport) the label and count gain a floating glass pill. The row
 * inherits the page gutter for horizontal alignment with the rows.
 */
export function MonthHeader({ monthStart, count, active }: MonthHeaderProps) {
  const pill = active && "glass rounded-full border px-4"
  return (
    <div className="flex flex-row items-center justify-between">
      <span className={cn("flex h-9 w-fit items-center font-semibold text-muted-foreground", pill)}>
        {MONTH_FMT.format(monthStart)}
      </span>
      <span className={cn("flex h-9 w-fit items-center text-sm text-muted-foreground", pill)}>
        {count} transaction{count !== 1 ? "s" : ""}
      </span>
    </div>
  )
}

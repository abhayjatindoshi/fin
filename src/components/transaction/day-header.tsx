import { cn } from "@/lib/utils"
import type { RenderHeaderArgs } from "./transaction-virtualizer"

const DAY_FMT = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
})

const DAY_FMT_WITH_YEAR = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
})

/** UTC day-start (ms) for an epoch — matches the virtualizer's grouping. */
function dayStartUtc(epochMs: number): number {
  const d = new Date(epochMs)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

/**
 * Label for a day group: "Today" / "Yesterday" for the two most recent days,
 * otherwise "Wed, 12 Jul" (with the year once it differs from the current one).
 */
function formatDay(dayStart: number): string {
  const now = Date.now()
  const today = dayStartUtc(now)
  const oneDay = 24 * 60 * 60 * 1000
  if (dayStart === today) return "Today"
  if (dayStart === today - oneDay) return "Yesterday"
  const sameYear = new Date(dayStart).getUTCFullYear() === new Date(now).getUTCFullYear()
  return (sameYear ? DAY_FMT : DAY_FMT_WITH_YEAR).format(dayStart)
}

export type DayHeaderProps = RenderHeaderArgs

/**
 * Sticky section header for a day group. When `active` (pinned at the top of
 * the scroll viewport) the label and count gain a floating glass pill. The row
 * inherits the page gutter for horizontal alignment with the rows.
 */
export function DayHeader({ dayStart, count, active }: DayHeaderProps) {
  const pill = active && "glass rounded-full border px-4"
  return (
    <div className="flex flex-row items-center justify-between">
      <span className={cn("flex h-8 w-fit items-center text-sm font-semibold text-muted-foreground", pill)}>
        {formatDay(dayStart)}
      </span>
      <span className={cn("flex h-8 w-fit items-center text-sm text-muted-foreground", pill)}>
        {count} transaction{count !== 1 ? "s" : ""}
      </span>
    </div>
  )
}

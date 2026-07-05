import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

// ─── Styles (carried over from the former OverflowBar) ────

const itemClassName = cn(
  "relative flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-sm transition-colors",
  "after:pointer-events-none after:absolute after:-top-4 after:h-16",
  "after:w-[calc(100%+--spacing(3)+13px)] after:-left-[calc(var(--spacing)*1.5+6px)]",
  "after:bg-[radial-gradient(ellipse_at_top,var(--accent),transparent_50%)]",
  "after:opacity-0 after:transition-opacity after:duration-500",
  "first:after:rounded-l-3xl last:after:rounded-r-3xl",
  "hover:after:opacity-25",
)

// ─── Types ────────────────────────────────────────────────

type PillBarItem = {
  readonly key: string
  readonly element: ReactNode
  readonly active?: boolean
}

type PillBarProps = {
  readonly items: readonly PillBarItem[]
  readonly className?: string
}

// ─── Component ────────────────────────────────────────────

/**
 * A static segmented pill bar — the item styling of the former OverflowBar
 * (soft radial-glow active state). Used for primary navigation and the
 * settings/dev section switcher, where the item set always fits.
 */
export function PillBar({ items, className }: PillBarProps) {
  return (
    <div className={cn("relative flex items-center gap-1 overflow-hidden", className)}>
      {items.map((item) => (
        <div
          key={item.key}
          className={cn(
            itemClassName,
            item.active
              ? "text-foreground after:opacity-50"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {item.element}
        </div>
      ))}
    </div>
  )
}

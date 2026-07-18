import type { ReactNode } from "react"
import { cva, type VariantProps } from "class-variance-authority"
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

const pillBarVariants = cva("relative flex items-center gap-1 overflow-hidden", {
  variants: {
    /** Background surface: bare (default) vs. a floating glass pill container. */
    surface: {
      default: "",
      glass: "glass h-12 rounded-full px-1.5 md:h-10",
    },
  },
  defaultVariants: { surface: "default" },
})

// ─── Types ────────────────────────────────────────────────

type PillBarItem = {
  readonly key: string
  readonly element: ReactNode
  readonly active?: boolean
}

type PillBarProps = VariantProps<typeof pillBarVariants> & {
  readonly items: readonly PillBarItem[]
  readonly className?: string
}

// ─── Component ────────────────────────────────────────────

/**
 * A static segmented pill bar — the item styling of the former OverflowBar
 * (soft radial-glow active state). Used for primary navigation and the
 * settings/dev section switcher, where the item set always fits. Pass
 * `surface="glass"` to render it as a floating glass pill container.
 */
export function PillBar({ items, surface, className }: PillBarProps) {
  return (
    <div className={cn(pillBarVariants({ surface }), className)}>
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

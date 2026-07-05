import { Button } from "@/ui/button"
import { cn } from "@/lib/utils"
import { pillVariants } from "@/ui/pill"
import type { FilterControlProps } from "../types"

/** Tagged / Untagged toggle. Clicking the active option clears it. Picking a
 *  side clears any specific-tag selection (the two are mutually exclusive). */
export function TagToggle({ state, className }: FilterControlProps) {
  const { filter, patch, untaggedCount } = state
  const value = filter.tag
  const toggle = (option: "tagged" | "untagged") => {
    patch({ tag: value === option ? null : option, tagId: undefined })
  }
  return (
    <div
      role="group"
      className={cn(pillVariants({ variant: "group" }), "w-full overflow-hidden *:flex-1", className)}
    >
      <Button
        className={cn("h-full rounded-full", value !== "tagged" && "font-light")}
        variant={value === "tagged" ? "default" : "ghost"}
        onClick={() => { toggle("tagged") }}
      >
        Tagged
      </Button>
      <Button
        className={cn("h-full rounded-full", value !== "untagged" && "font-light")}
        variant={value === "untagged" ? "default" : "ghost"}
        onClick={() => { toggle("untagged") }}
      >
        Untagged
        {untaggedCount > 0 && (
          <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-medium text-secondary-foreground tabular-nums">
            {untaggedCount}
          </span>
        )}
      </Button>
    </div>
  )
}

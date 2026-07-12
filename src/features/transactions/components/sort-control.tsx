import { Icon } from "@/ui/icon"
import { cn } from "@/lib/utils"
import type { FilterControlProps } from "../types"

/** Toggles the transaction sort between newest-first and oldest-first. */
export function SortControl({ state, className }: FilterControlProps) {
  const { filter, patch } = state
  const desc = filter.sort === "desc"
  return (
    <button
      type="button"
      className={cn(
        "pill cursor-pointer px-3 hover:bg-muted hover:text-foreground",
        "w-full justify-start font-light",
        className,
      )}
      onClick={() => { patch({ sort: desc ? "asc" : "desc" }) }}
    >
      <Icon name={desc ? "arrow-down-wide-narrow" : "arrow-up-narrow-wide"} />
      {desc ? "Newest first" : "Oldest first"}
    </button>
  )
}

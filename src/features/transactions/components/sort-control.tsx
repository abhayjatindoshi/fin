import { Button } from "@/ui/button"
import { Icon } from "@/ui/icon"
import { cn } from "@/lib/utils"
import { pillVariants } from "@/ui/pill"
import type { FilterControlProps } from "../types"

/** Toggles the transaction sort between newest-first and oldest-first. */
export function SortControl({ state, className }: FilterControlProps) {
  const { filter, patch } = state
  const desc = filter.sort === "desc"
  return (
    <Button
      variant="ghost"
      className={cn(pillVariants({ variant: "label", interactive: true }), "w-full justify-start font-light", className)}
      onClick={() => { patch({ sort: desc ? "asc" : "desc" }) }}
    >
      <Icon name={desc ? "arrow-down-wide-narrow" : "arrow-up-narrow-wide"} />
      {desc ? "Newest first" : "Oldest first"}
    </Button>
  )
}

import { Icon } from "@/ui/icon"
import { Input } from "@/ui/input"
import { cn } from "@/lib/utils"
import type { FilterControlProps } from "@/views/filter-control-props"

export type SearchBarProps = FilterControlProps & {
  readonly autoFocus?: boolean
}

/**
 * Search input with a leading icon and a clear affordance. Built on the shared
 * pill; fills the width of its container (the AppBar slot).
 */
export function SearchBar({ state, className, autoFocus }: SearchBarProps) {
  const { filter, patch } = state
  const value = filter.search
  const onChange = (next: string) => { patch({ search: next }) }

  return (
    <div className={cn("pill glass", "relative min-w-0 flex-1 px-0", className)}>
      <Icon
        name="search"
        className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => { onChange(e.target.value) }}
        placeholder="Search…"
        className="h-full rounded-full border-0 bg-transparent px-7 focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent"
      />
      {value !== "" && (
        <button
          type="button"
          onClick={() => { onChange("") }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <Icon name="x" className="size-3.5" />
        </button>
      )}
    </div>
  )
}

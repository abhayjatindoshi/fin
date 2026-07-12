import { useState } from "react"
import { Button } from "@/ui/button"
import { Icon } from "@/ui/icon"
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/popover"
import { cn } from "@/lib/utils"
import { SortControl } from "../components/sort-control"
import { AccountFilter } from "./account-filter"
import { TagToggle } from "../components/tag-toggle"
import { TagSelect } from "./tag-select"
import { AmountRange } from "./amount-range"
import { SearchBar } from "@/components/search-bar"
import type { UseTransactionsFilter } from "../hooks/use-transactions-filter"

export type FilterBarProps = {
  readonly state: UseTransactionsFilter
}

/**
 * Desktop transaction filters — a single line of control pills aligned left
 * and the search pill on the right. Rendered in the shell's secondary slot.
 */
export function FilterBar({ state }: FilterBarProps) {
  const { clearAll, dirty } = state
  return (
    <div className="flex w-full items-center gap-2">
      <SortControl state={state} className="glass w-auto border border-border" />
      <AccountFilter state={state} className="glass w-auto border border-border" />
      <TagToggle state={state} className="glass w-auto border border-border" />
      <TagSelect state={state} className="glass w-auto border border-border" />
      <AmountPill state={state} />
      {dirty && (
        <Button variant="ghost" size="sm" className="shrink-0" onClick={clearAll}>
          Clear
        </Button>
      )}
      <SearchBar state={state} className="ml-auto w-64 flex-none border border-border" />
    </div>
  )
}

function AmountPill({ state }: { readonly state: UseTransactionsFilter }) {
  const [open, setOpen] = useState(false)
  const active = state.filter.amountMin != null || state.filter.amountMax != null
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "pill glass cursor-pointer px-3 hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
            "w-auto border border-border font-light",
            active && "font-normal text-foreground",
          )}
        >
          <Icon name="banknote" className={cn(!active && "text-muted-foreground")} />
          <span>Amount</span>
          <Icon name="chevron-down" className="text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64">
        <AmountRange state={state} />
      </PopoverContent>
    </Popover>
  )
}

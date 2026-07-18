import { Button } from "@/ui/button"
import { Icon } from "@/ui/icon"
import { cn } from "@/lib/utils"
import { getAccountDisplay } from "@/catalog/account-display"
import { getCurrencyMeta } from "@/lib/format"
import { useObservable } from "@/providers/use-observable"
import { useServices } from "@/providers/services-provider"
import type { UseTransactionsFilter } from "../hooks/use-transactions-filter"

type Chip = {
  readonly key: string
  readonly label: string
  readonly onRemove: () => void
}

export type ActiveFiltersProps = {
  readonly state: UseTransactionsFilter
}

/**
 * The applied-filter chip strip. Each active constraint renders as a removable
 * pill; the row scrolls horizontally when the chips overflow, with a
 * right-pinned "Clear filters". Rendered in the shell's secondary slot.
 */
export function ActiveFilters({ state }: ActiveFiltersProps) {
  const chips = useActiveChips(state)
  if (chips.length === 0) return null
  return (
    <div className="flex items-center gap-2">
      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {chips.map((chip) => (
          <FilterChip key={chip.key} label={chip.label} onRemove={chip.onRemove} />
        ))}
      </div>
      <Button variant="ghost" size="sm" className="shrink-0" onClick={state.clearAll}>
        Clear filters
      </Button>
    </div>
  )
}

function FilterChip({ label, onRemove }: { readonly label: string; readonly onRemove: () => void }) {
  return (
    <span
      className={cn(
        "pill glass",
        "h-8 shrink-0 gap-1 border border-border py-0 pr-1 pl-2.5 text-xs font-light",
      )}
    >
      <span className="truncate">{label}</span>
      <button
        type="button"
        aria-label={`Remove ${label} filter`}
        onClick={onRemove}
        className="flex size-5 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Icon name="x" className="size-3" />
      </button>
    </span>
  )
}

function useActiveChips(state: UseTransactionsFilter): Chip[] {
  const { filter, patch } = state
  const accounts = useObservable(useServices().accounts.accounts$)
  const tags = useObservable(useServices().tags.displayTags$)
  const settings = useObservable(useServices().settings.settings$)
  const symbol = getCurrencyMeta(settings.currency)?.symbol ?? ""

  const chips: Chip[] = []

  for (const id of filter.accountIds) {
    const account = accounts.find((a) => a.id === id)
    chips.push({
      key: `account:${id}`,
      label: account ? getAccountDisplay(account).label : "Account",
      onRemove: () => { patch({ accountIds: filter.accountIds.filter((x) => x !== id) }) },
    })
  }

  if (filter.tag) {
    chips.push({
      key: "tag",
      label: filter.tag === "tagged" ? "Tagged" : "Untagged",
      onRemove: () => { patch({ tag: null }) },
    })
  }

  if (filter.tagId !== undefined) {
    const tag = tags.find((t) => t.id === filter.tagId)
    chips.push({
      key: "tagId",
      label: tag ? tag.name : "Tag",
      onRemove: () => { patch({ tagId: undefined }) },
    })
  }

  if (filter.amountMin !== undefined || filter.amountMax !== undefined) {
    chips.push({
      key: "amount",
      label: amountLabel(symbol, filter.amountMin, filter.amountMax),
      onRemove: () => { patch({ amountMin: undefined, amountMax: undefined }) },
    })
  }

  return chips
}

function amountLabel(symbol: string, min?: number, max?: number): string {
  if (min !== undefined && max !== undefined) return `${symbol}${String(min)} – ${symbol}${String(max)}`
  if (min !== undefined) return `≥ ${symbol}${String(min)}`
  return `≤ ${symbol}${max === undefined ? "" : String(max)}`
}

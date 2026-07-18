import { Input } from "@/ui/input"
import { cn } from "@/lib/utils"
import { useObservable } from "@/providers/use-observable"
import { useServices } from "@/providers/services-provider"
import { getCurrencyMeta } from "@/lib/format"
import type { FilterControlProps } from "../types"

function parse(value: string): number | undefined {
  const trimmed = value.trim()
  if (trimmed === "") return undefined
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : undefined
}

/** Min/max amount filter (major units, absolute value) — an inline min/max pair. */
export function AmountRange({ state, className }: FilterControlProps) {
  const { filter, patch } = state
  const min = filter.amountMin
  const max = filter.amountMax
  const settings = useObservable(useServices().settings.settings$)
  const symbol = getCurrencyMeta(settings.currency)?.symbol ?? ""

  const fields = (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        {symbol && (
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {symbol}
          </span>
        )}
        <Input
          type="number"
          inputMode="decimal"
          placeholder="Min"
          value={min ?? ""}
          onChange={(e) => { patch({ amountMin: parse(e.target.value) }) }}
          className={cn(symbol && "pl-6")}
        />
      </div>
      <span className="text-muted-foreground">–</span>
      <div className="relative flex-1">
        {symbol && (
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {symbol}
          </span>
        )}
        <Input
          type="number"
          inputMode="decimal"
          placeholder="Max"
          value={max ?? ""}
          onChange={(e) => { patch({ amountMax: parse(e.target.value) }) }}
          className={cn(symbol && "pl-6")}
        />
      </div>
    </div>
  )

  return <div className={className}>{fields}</div>
}

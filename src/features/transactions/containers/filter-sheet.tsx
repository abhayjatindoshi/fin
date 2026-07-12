import { useState, type Ref } from "react"
import { AdaptiveSurface } from "@/components/adaptive-surface"
import { Button } from "@/ui/button"
import { Icon } from "@/ui/icon"
import { SortControl } from "../components/sort-control"
import { AccountFilter } from "./account-filter"
import { TagToggle } from "../components/tag-toggle"
import { TagSelect } from "./tag-select"
import { AmountRange } from "./amount-range"
import { SearchBar } from "@/components/search-bar"
import type { UseTransactionsFilter } from "../hooks/use-transactions-filter"

export type FilterSheetProps = {
  readonly state: UseTransactionsFilter
  readonly resultCount: number
  readonly ref?: Ref<HTMLDivElement>
}

/**
 * Mobile filtering — a collapsible search pill and a filter pill (with an
 * active-count badge) that opens a bottom sheet of stacked controls. Live
 * apply, no Apply button; the list updates behind the partial-height sheet.
 */
export function FilterSheet({ state, resultCount, ref }: FilterSheetProps) {
  const { clearAll, activeCount, dirty } = state
  const [open, setOpen] = useState(false)

  return (
    <div ref={ref} className="flex min-w-0 flex-1 flex-row items-center gap-4">
      <SearchBar state={state} />
      <AdaptiveSurface
        open={open}
        onOpenChange={setOpen}
        title="Filters"
        trigger={
          <button
            type="button"
            aria-label="Filters"
            className="pill glass relative aspect-square shrink-0 cursor-pointer border border-border hover:bg-muted hover:text-foreground aria-expanded:bg-muted"
          >
            <Icon name="sliders-horizontal" />
            {activeCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 inline-flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground tabular-nums">
                {activeCount}
              </span>
            )}
          </button>
        }
        content={
          <div className="flex flex-col gap-2.5 px-4 pb-4">
            <Field label="Sort">
              <SortControl state={state} />
            </Field>
            <Field label="Accounts">
              <AccountFilter state={state} />
            </Field>
            <Field label="Status">
              <TagToggle state={state} />
            </Field>
            <Field label="Tag">
              <TagSelect state={state} />
            </Field>
            <Field label="Amount">
              <AmountRange state={state} />
            </Field>

            <div className="mt-2 flex items-center justify-between border-t pt-3">
              <span className="text-sm text-muted-foreground tabular-nums">
                {resultCount} transaction{resultCount !== 1 ? "s" : ""}
              </span>
              <Button variant="ghost" size="sm" disabled={!dirty} onClick={clearAll}>
                Clear all
              </Button>
            </div>
          </div>
        }
        desktop={{ type: "popover", props: { surface: "glass" } }}
        mobile={{ type: "sheet", props: { side: "bottom", surface: "glass", className: "gap-2" } }}
      />
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-xs font-medium text-muted-foreground">{label}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

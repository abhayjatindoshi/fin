import { useMemo, useState } from "react"
import { Icon } from "@/ui/icon"
import { Input } from "@/ui/input"
import { Button } from "@/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/ui/toggle-group"
import { Money } from "@/components/money"
import { useObservable } from "@/providers/use-observable"
import { useServices } from "@/providers/services-provider"
import { CALIBRATABLE_CATEGORIES, type CalibratableCategory } from "@/catalog/calibratable-categories"
import { majorToMinor, minorToMajor } from "@/lib/format"
import type { BudgetPeriod, BudgetRow } from "@/entities/budget"
import { cn } from "@/lib/utils"

/**
 * Budgets settings (§13). Draw a single watch-line on any top-level category for
 * the selected fiscal year: an amount + whether it's monthly or yearly. Setting
 * a budget is what promotes a category from signal-only into a completeness
 * contract — the calibration engine's Rule 1 ("you asked me to watch this").
 *
 * Scoped to the year pill: each fiscal year is its own set of rows (a budget is
 * earned per year, never carried forward — §13.3), so switching the year here
 * shows that year's budgets. Excluded categories (self-transfer, cash) aren't
 * listed — they never carry a verdict.
 */
export function BudgetsSection() {
  const { budgets: budgetsService, settings } = useServices()
  const budgets = useObservable(budgetsService.budgets$)
  const year = useObservable(settings.selectedYear$)
  const { currency } = useObservable(settings.settings$)

  const budgetByTag = useMemo(
    () => new Map(budgets.map((b) => [b.tagId, b])),
    [budgets],
  )

  const setCount = budgets.length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2 px-1">
        <p className="text-sm text-muted-foreground">
          Draw a watch-line on a category for the{" "}
          <span className="font-medium text-foreground">{year}</span> fiscal year.
          Pai will brief you on your progress.
        </p>
      </div>

      {setCount === 0 && (
        <p className="px-1 text-xs text-muted-foreground">
          No budgets set for {year} yet. Set one below — most categories don't need
          one, and that's fine.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {CALIBRATABLE_CATEGORIES.map((category) => (
          <BudgetRowEditor
            key={category.id}
            category={category}
            currency={currency}
            budget={budgetByTag.get(category.id)}
            onSet={(amount, period) => { budgetsService.set({ tagId: category.id, amount, period }) }}
            onClear={() => { budgetsService.remove(category.id) }}
          />
        ))}
      </div>
    </div>
  )
}

type BudgetRowEditorProps = {
  readonly category: CalibratableCategory
  readonly currency: string
  readonly budget: BudgetRow | undefined
  readonly onSet: (amount: number, period: BudgetPeriod) => void
  readonly onClear: () => void
}

/**
 * One category row: shows the current budget (if any) and expands to an inline
 * editor. The amount is entered in major units and stored in minor; the period
 * is a monthly/yearly toggle (the §13.4 xor — one budget per tag per year).
 */
function BudgetRowEditor({ category, currency, budget, onSet, onClear }: BudgetRowEditorProps) {
  const [editing, setEditing] = useState(false)
  const [amount, setAmount] = useState("")
  const [period, setPeriod] = useState<BudgetPeriod>("monthly")

  const open = () => {
    setAmount(budget ? String(minorToMajor(budget.amount, currency)) : "")
    setPeriod(budget?.period ?? "monthly")
    setEditing(true)
  }

  const save = () => {
    const minor = majorToMinor(Number(amount), currency)
    if (minor > 0) onSet(minor, period)
    setEditing(false)
  }

  const clear = () => {
    onClear()
    setEditing(false)
  }

  const goalWord = category.direction === "floor" ? "goal" : "budget"

  if (!editing) {
    return (
      <button
        type="button"
        onClick={open}
        className="flex cursor-pointer items-center gap-3 rounded-xl bg-card px-4 py-3 text-left ring-1 ring-foreground/10 hover:ring-foreground/20"
      >
        <Icon name={category.icon} className="size-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 font-medium">{category.name}</span>
        {budget ? (
          <span className="flex items-center gap-1.5 text-sm">
            <Money amount={budget.amount} currency={currency} className="font-medium" />
            <span className="text-xs text-muted-foreground">/ {budget.period === "yearly" ? "yr" : "mo"}</span>
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Icon name="plus" className="size-3.5" /> Set {goalWord}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/15">
      <div className="flex items-center gap-3">
        <Icon name={category.icon} className="size-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 font-medium">{category.name}</span>
        {budget && (
          <Button variant="ghost" size="sm" aria-label={`Clear ${category.name} ${goalWord}`} onClick={clear}>
            <Icon name="trash-2" className="size-4" />
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="number"
          inputMode="decimal"
          min={0}
          autoFocus
          placeholder="Amount"
          value={amount}
          onChange={(e) => { setAmount(e.target.value) }}
          onKeyDown={(e) => { if (e.key === "Enter") save() }}
          className="w-32"
        />
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={period}
          onValueChange={(v) => { if (v) setPeriod(v as BudgetPeriod) }}
        >
          <ToggleGroupItem value="monthly">Monthly</ToggleGroupItem>
          <ToggleGroupItem value="yearly">Yearly</ToggleGroupItem>
        </ToggleGroup>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => { setEditing(false) }}>Cancel</Button>
          <Button
            variant="default"
            size="sm"
            disabled={majorToMinor(Number(amount), currency) <= 0}
            className={cn(majorToMinor(Number(amount), currency) <= 0 && "opacity-50")}
            onClick={save}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}

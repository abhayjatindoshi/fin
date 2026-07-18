import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { AmountCell } from "./amount-cell"
import { DescriptionCell } from "./description-cell"
import { transactionRowFrame as rowFrame } from "./transaction-row-frame"
import { TransactionRow } from "./transaction-row"

/** Variant C won the comparison and is now the production row. */
export { TransactionRow as TransactionRowVariantC }

/**
 * Candidate layouts for the unified, date-less transaction row. The date now
 * lives in the (day) group header, so these rows carry only amount,
 * description, tag, and account — arranged three different ways for comparison.
 * All three share one prop shape so the winner can drop into the virtualizer's
 * `renderRow` unchanged. Presentational: `tagCell`/`accountCell` are resolved
 * by the feature container.
 */
export type TransactionRowVariantProps = {
  readonly amount: number
  readonly title?: string | null
  readonly narration: string
  /** Resolved tag cell (interactive picker) — supplied by the feature container. */
  readonly tagCell: ReactNode
  /** Resolved account cell — supplied by the feature container. */
  readonly accountCell: ReactNode
  readonly first?: boolean
  readonly last?: boolean
  readonly selected?: boolean
  readonly onClick?: () => void
}

/**
 * Variant A — icon-led single line: `[account] description … [tag] [amount]`.
 * Densest option; the account mark anchors the left, amount the right.
 */
export function TransactionRowVariantA({
  amount,
  title,
  narration,
  tagCell,
  accountCell,
  first,
  last,
  selected,
  onClick,
}: TransactionRowVariantProps) {
  return (
    <div onClick={onClick} className={cn(rowFrame(first, last, selected), "gap-3")}>
      <div className="shrink-0">{accountCell}</div>
      <div className="min-w-0 flex-1"><DescriptionCell title={title} narration={narration} /></div>
      <div className="shrink-0">{tagCell}</div>
      <div className="shrink-0"><AmountCell amount={amount} variant="table" /></div>
    </div>
  )
}

/**
 * Variant B — two-tier compact: description + amount on top, account + tag
 * muted below. Taller than A/C but keeps every field legible.
 */
export function TransactionRowVariantB({
  amount,
  title,
  narration,
  tagCell,
  accountCell,
  first,
  last,
  selected,
  onClick,
}: TransactionRowVariantProps) {
  return (
    <div onClick={onClick} className={cn(rowFrame(first, last, selected), "py-2")}>
      <div className="flex min-w-0 flex-1 flex-row justify-center gap-1">
            <div className="flex flex-col flex-1">
                <div className="flex flex-row items-center justify-between gap-3">
                <div className="min-w-0 flex-1"><DescriptionCell title={title} narration={narration} /></div>
                </div>
                <div className="flex flex-row items-center gap-2 text-muted-foreground">
                {accountCell}
                {tagCell}
                </div>
            </div>
            <AmountCell amount={amount} variant="card" className="leading-none" />
      </div>
    </div>
  )
}

/**
 * Variant C won the comparison — its production implementation lives in
 * `transaction-row.tsx` and is re-exported above as `TransactionRowVariantC`.
 */

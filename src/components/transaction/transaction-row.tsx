import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { AmountCell } from "./amount-cell"
import { DescriptionCell } from "./description-cell"
import { transactionRowFrame } from "./transaction-row-frame"

export type TransactionRowProps = {
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
 * The unified transaction row for both mobile and desktop — amount-led single
 * line: `[amount] description … [tag] [account]`. The date is intentionally
 * absent; it lives in the day-group header. Presentational: `tagCell` and
 * `accountCell` are resolved by the feature container.
 */
export function TransactionRow({
  amount,
  title,
  narration,
  tagCell,
  accountCell,
  first,
  last,
  selected,
  onClick,
}: TransactionRowProps) {
  return (
    <div onClick={onClick} className={cn(transactionRowFrame(first, last, selected), "gap-3")}>
      <div className="w-24 shrink-0 sm:w-28"><AmountCell amount={amount} variant="table" /></div>
      <div className="min-w-0 flex-1"><DescriptionCell title={title} narration={narration} /></div>
      <div className="shrink-0">{tagCell}</div>
      <div className="shrink-0">{accountCell}</div>
    </div>
  )
}

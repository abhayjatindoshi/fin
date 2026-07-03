import { useState } from "react"
import { Icon } from "@/ui/icon"
import { Button } from "@/ui/button"
import { Checkbox } from "@/ui/checkbox"
import { Separator } from "@/ui/separator"
import { Money } from "@/components/money"
import { accountIconName } from "@/catalog/icon-resolve"
import { TagPicker } from "@/features/transactions/containers/tag-picker"
import { TagCell } from "@/features/transactions/containers/tag-cell"
import type { TagView } from "@/views/tag-view"
import type { TransactionRow } from "@/entities/transaction"
import type { AccountView } from "@/views/account-view"
import { cn } from "@/lib/utils"

const CARD_DATE_FMT = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
})

/** A resolved similar-preview: the count + the sample rows to peek at. */
export type SimilarPreview = {
  readonly count: number
  readonly sample: readonly TransactionRow[]
}

export type TagCardProps = {
  readonly tx: TransactionRow
  readonly account: AccountView | undefined
  /** The tag chosen for this card (drives the confirm bar), or null before a pick. */
  readonly pickedTag: TagView | null
  readonly onPick: (tag: TagView | null) => void
  /** Similar untagged look-alikes this pick would tag too (undefined = none). */
  readonly similar: SimilarPreview | undefined
  /** Whether "apply to all similar" is checked (pre-checked by default). */
  readonly applyToAll: boolean
  readonly onApplyToAllChange: (checked: boolean) => void
  /** Confirm the pick — the container tags + triggers the swipe-right. */
  readonly onConfirm: () => void
  /** Clear the pick and return to the untagged face. */
  readonly onClearPick: () => void
}

/**
 * The face of a tagging card: the transaction's full detail, a tag picker, a
 * collapsible peek at look-alikes, and — once a tag is chosen — a confirm bar
 * carrying the pre-checked "apply to all N similar" opt-out (§ user decision).
 *
 * Presentational: it renders state and raises intents; the container owns the
 * service calls and the swipe. Works on mobile (full-width) and desktop (the
 * deck constrains width) with no layout fork of its own.
 */
export function TagCard({
  tx,
  account,
  pickedTag,
  onPick,
  similar,
  applyToAll,
  onApplyToAllChange,
  onConfirm,
  onClearPick,
}: TagCardProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [peekOpen, setPeekOpen] = useState(false)
  const debited = tx.amount < 0
  const similarCount = similar?.count ?? 0

  return (
    <div className="flex select-none flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
      {/* Amount — the hero. */}
      <div className="flex flex-col items-center gap-1 pt-2">
        <div className="text-3xl font-light">
          <Money amount={tx.amount} variant="icon" />
        </div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          {debited ? "Debited" : "Received"}
        </div>
      </div>

      {/* Narration — the identity line. */}
      <div className="text-center text-sm font-medium wrap-break-word">{tx.narration}</div>

      <Separator />

      {/* Meta rows. */}
      <div className="flex flex-col gap-2 text-sm">
        <div className="flex items-center gap-2">
          <Icon name="calendar" className="size-4 shrink-0 text-muted-foreground" />
          <span>{CARD_DATE_FMT.format(tx.transactionAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Icon
            name={debited ? "circle-arrow-up" : "circle-arrow-down"}
            className="size-4 shrink-0 text-muted-foreground"
          />
          <span className="text-muted-foreground">{debited ? "From" : "To"}</span>
          {account ? (
            <>
              <Icon name={accountIconName(account)} className="size-4" />
              <span className="truncate">{account.maskedNumber ?? account.name}</span>
            </>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
      </div>

      {/* Similar look-alikes — collapsed by default ("+N like this"). */}
      {similarCount > 0 && (
        <div className="rounded-lg bg-muted/40 p-2">
          <button
            type="button"
            onClick={() => { setPeekOpen((v) => !v) }}
            className="flex w-full items-center gap-2 px-1 text-sm"
          >
            <Icon name="tags" className="size-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 text-left text-muted-foreground">
              +{similarCount} like this
            </span>
            <Icon name={peekOpen ? "chevron-down" : "chevron-right"} className="size-4 text-muted-foreground" />
          </button>
          {peekOpen && similar && (
            <div className="mt-2 flex flex-col gap-1.5 px-1">
              {similar.sample.map((s) => (
                <div key={s.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex-1 truncate">{s.narration}</span>
                  <Money amount={s.amount} className="shrink-0" />
                </div>
              ))}
              {similarCount > similar.sample.length && (
                <div className="text-xs text-muted-foreground/70">
                  and {similarCount - similar.sample.length} more…
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <Separator />

      {/* Action zone: pick a tag → confirm (with apply-to-all opt-out). */}
      {pickedTag === null ? (
        <TagPicker
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          selectedTagId={null}
          onSelect={onPick}
        >
          <Button variant="secondary" className="w-full justify-center" size="lg">
            <Icon name="tag" className="size-4" /> Pick a tag
          </Button>
        </TagPicker>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Tagging as</span>
            <TagCell tagId={pickedTag.id} />
            <button
              type="button"
              onClick={onClearPick}
              aria-label="Change tag"
              className="ml-auto text-muted-foreground hover:text-foreground"
            >
              <Icon name="x" className="size-4" />
            </button>
          </div>

          {/* The pre-checked apply-to-all opt-out (§ user decision). */}
          {similarCount > 0 && (
            <label
              className={cn(
                "flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 text-sm transition-colors",
                applyToAll ? "border-primary/40 bg-primary/5" : "border-input",
              )}
            >
              <Checkbox
                checked={applyToAll}
                onCheckedChange={(c) => { onApplyToAllChange(c === true) }}
                className="mt-0.5"
              />
              <span>
                Also tag{" "}
                <span className="font-medium text-foreground">
                  {similarCount} similar {similarCount === 1 ? "transaction" : "transactions"}
                </span>{" "}
                as {pickedTag.name}
                <span className="block text-xs text-muted-foreground">
                  Uncheck to tag only this one.
                </span>
              </span>
            </label>
          )}

          <Button onClick={onConfirm} size="lg" className="w-full justify-center">
            <Icon name="check" className="size-4" />
            {similarCount > 0 && applyToAll
              ? `Tag ${similarCount + 1} transactions`
              : "Tag this transaction"}
          </Button>
        </div>
      )}
    </div>
  )
}

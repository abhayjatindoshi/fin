/**
 * Pure spend-rollup for the monthly briefing — the layer the engines assume the
 * app provides ("the engine does not itself sum transactions — it's handed the
 * totals", `calibration/types.ts`). No repos, no rxjs: just transactions + a tag
 * index in, `CategorySpend[]` out. Kept pure so the rollup rules (what counts,
 * how months are chosen) are unit-testable in isolation.
 *
 * The rules it encodes (all load-bearing — see `docs/baseline-calibration-design.md`):
 *   - **Per-parent (§2).** Every transaction rolls up to its category = the tag's
 *     parent, or the tag itself when it's a root. Calibration reasons per parent.
 *   - **Exclusions.** Untagged rows, unknown tags, and any category whose effective
 *     `flow` is `excluded` (self-transfer, cash, card-repay, shared) are dropped
 *     before totals — they never reach a verdict (§13.2). Synthetic
 *     `account-<id>` self-transfer tags aren't in the tag index, so they drop as
 *     unknown; a row tagged the `system-tag-selftransfer` root drops on `excluded`.
 *   - **Magnitudes.** Amounts are signed (sign = direction); the engine compares
 *     positive numbers and resolves good/bad off the tag's `flow`. So each month's
 *     category total is `|Σ amount|` — netting refunds within the category first.
 *   - **Active months.** "This month" is the LAST fiscal-year month carrying any
 *     included transaction; "trailing" is the active months before it, in order
 *     (most-recent-last). A fiscal month with no data at all is skipped (not yet
 *     happened / not imported), so leading empties don't dilute the baseline —
 *     while a real zero in an active month is kept and honestly drags the median.
 */

import type { Money } from "@/entities/money"
import type { TagType, TagFlow } from "@/entities/tag"
import type { CategorySpend } from "@/services/calibration"

/** The tag metadata the rollup needs — a flat index over system + user tags. */
export type TagMeta = {
  readonly id: string
  readonly parent?: string
  readonly type?: TagType
  readonly flow?: TagFlow
}

/** A transaction as the rollup reads it — the minimum the totals need. */
export type RollupTransaction = {
  readonly tagId?: string
  readonly transactionAt: number
  readonly amount: Money
}

/** The rollup result: the engine inputs plus which month was judged. */
export type BriefingRollup = {
  /** One entry per included category, ready for the calibration/attention engines. */
  readonly spends: readonly CategorySpend[]
  /** `YYYY-MM` of the judged month, or `undefined` when the year has no data. */
  readonly thisMonthKey: string | undefined
}

/** `YYYY-MM` (UTC) partition key for a timestamp — matches the transaction entity. */
function monthKeyOf(transactionAt: number): string {
  const d = new Date(transactionAt)
  const year = d.getUTCFullYear()
  const month = String(d.getUTCMonth() + 1).padStart(2, "0")
  return `${year}-${month}`
}

/**
 * The calibration category a tag rolls up to (its parent, or itself when a root),
 * or `undefined` when the tag is untagged/unknown. Unknown covers synthetic
 * `account-<id>` self-transfer tags, which aren't in the index and so drop here.
 */
export function categoryOf(
  tagId: string | undefined,
  tagsById: ReadonlyMap<string, TagMeta>,
): string | undefined {
  if (tagId === undefined) return undefined
  const tag = tagsById.get(tagId)
  if (tag === undefined) return undefined
  return tag.parent ?? tag.id
}

/**
 * Rolls a fiscal year's transactions into `CategorySpend[]` for the judged month.
 *
 * @param transactions all transactions for the loaded fiscal year (any month order).
 * @param monthKeys    the 12 fiscal-year month keys, in fiscal order (from `fiscalYearMonthKeys`).
 * @param tagsById     flat tag index (system + user), for parent + flow resolution.
 */
export function rollUp(
  transactions: readonly RollupTransaction[],
  monthKeys: readonly string[],
  tagsById: ReadonlyMap<string, TagMeta>,
): BriefingRollup {
  // categoryId → (monthKey → running signed sum)
  const byCategory = new Map<string, Map<string, number>>()
  const activeMonths = new Set<string>()

  for (const tx of transactions) {
    const categoryId = categoryOf(tx.tagId, tagsById)
    if (categoryId === undefined) continue

    // Drop excluded-flow categories before they hit any total (§13.2). Effective
    // flow lives on the category (parent) tag, inherited onto children at seed.
    const category = tagsById.get(categoryId)
    if (category?.flow === "excluded") continue

    const key = monthKeyOf(tx.transactionAt)
    // Only months that belong to the selected fiscal year count.
    if (!monthKeys.includes(key)) continue

    activeMonths.add(key)
    let months = byCategory.get(categoryId)
    if (months === undefined) {
      months = new Map<string, number>()
      byCategory.set(categoryId, months)
    }
    months.set(key, (months.get(key) ?? 0) + tx.amount)
  }

  // Active fiscal months in order; the judged month is the last one with data.
  const orderedActive = monthKeys.filter((k) => activeMonths.has(k))
  const thisMonthKey = orderedActive.at(-1)
  if (thisMonthKey === undefined) {
    return { spends: [], thisMonthKey: undefined }
  }
  const trailingKeys = orderedActive.slice(0, -1)
  const ytdKeys = [...trailingKeys, thisMonthKey]

  const spends: CategorySpend[] = []
  for (const [tagId, months] of byCategory) {
    const magnitude = (key: string): Money => Math.abs(months.get(key) ?? 0)
    spends.push({
      tagId,
      thisMonth: magnitude(thisMonthKey),
      trailing: trailingKeys.map(magnitude),
      yearToDate: Math.abs(ytdKeys.reduce((sum, key) => sum + (months.get(key) ?? 0), 0)),
    })
  }

  return { spends, thisMonthKey }
}

/** Human month label for a `YYYY-MM` key, e.g. `"November 2025"`. */
export function formatMonthKey(monthKey: string, locale: string): string {
  const [year, month] = monthKey.split("-").map(Number)
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)))
}

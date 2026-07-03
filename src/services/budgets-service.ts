/**
 * BudgetsService — the per-tenant domain service for budgets (§13). One instance
 * per `FyreDb`, constructed and disposed by the service registry
 * (`ServicesProvider`).
 *
 * A budget is the user drawing a single watch-line on one tag for one fiscal
 * year (`{ tagId, year, amount, period }`). The `budget` entity is partitioned
 * by fiscal year, so this service scopes every read to the *selected* year
 * (driven by `SettingsService.selectedYear$`) and keeps exactly that partition
 * warm. Switching the year pill re-points the live query and hydrates the new
 * partition lazily.
 *
 * The store owns the truth — this service holds no mirror copy beyond the
 * `BehaviorSubject` snapshot that `useObservable` binds. Writes go straight to
 * the repo (`save`/`delete`); the reactive `budgets$` re-emits from the store's
 * own `observeQuery`, so a set is reflected without a manual refresh.
 *
 * The composite id `tagId:year` bakes in the §13.4 monthly-xor-yearly invariant:
 * setting a monthly then a yearly budget on the same tag upserts the SAME row,
 * so a tag can never carry two conflicting budgets in one year.
 */

import { BehaviorSubject, Subscription } from "rxjs"
import type { FyreDb, RepositoryType as Repository } from "@fyre-db/core"

import { budgetEntity, budgetYearKey } from "@/entities/budget"
import type { Budget, BudgetPeriod, BudgetRow } from "@/entities/budget"
import type { Money } from "@/entities/money"
import type { Disposable, ReadonlySubject } from "@/services/types"
import type { SettingsService } from "@/services/settings-service"

/** The fields a caller supplies to set a budget; year is the service's concern. */
export type BudgetInput = {
  readonly tagId: string
  readonly amount: Money
  readonly period: BudgetPeriod
}

export class BudgetsService implements Disposable {
  private readonly repo: Repository<Budget>
  private readonly subs = new Subscription()

  /** The active fiscal year — mirrors the year pill; every read scopes to it. */
  private year: number

  /** The live budgets for the active year, keyed for the UI. */
  private readonly budgets = new BehaviorSubject<readonly BudgetRow[]>([])

  /** The store subscription for the CURRENT year; swapped on year change. */
  private yearSub: Subscription | undefined

  constructor(fyredb: FyreDb, settings: SettingsService) {
    this.repo = fyredb.repo(budgetEntity)
    this.year = settings.selectedYear$.value
    // Re-scope the live query whenever the selected year changes. The initial
    // emit from `selectedYear$` (a BehaviorSubject) wires up the first year, so
    // there's no separate bootstrap call.
    this.subs.add(
      settings.selectedYear$.subscribe((year) => {
        this.year = year
        this.observeYear(year)
      }),
    )
  }

  // ── Exposes ──────────────────────────────────────────────
  /** The budgets for the selected fiscal year, live. */
  get budgets$(): ReadonlySubject<readonly BudgetRow[]> {
    return this.budgets
  }

  /** The budget for a tag in the selected year, or `undefined`. Sync snapshot. */
  budgetFor(tagId: string): BudgetRow | undefined {
    return this.budgets.value.find((b) => b.tagId === tagId)
  }

  // ── Ops ──────────────────────────────────────────────────
  /**
   * Sets (creates or replaces) the budget for a tag in the selected year. The
   * composite id `tagId:year` means a second set on the same tag upserts the
   * same row — switching a monthly budget to yearly (or changing the amount)
   * never leaves a stale duplicate (§13.4).
   */
  set(input: BudgetInput): void {
    this.repo.save({
      tagId: input.tagId,
      year: this.year,
      amount: input.amount,
      period: input.period,
    })
  }

  /** Removes a tag's budget for the selected year. No-op if none exists. */
  remove(tagId: string): void {
    // Delete by the row's real store id (partitioned entities namespace the id
    // as `budget.<year>.<tagId>:<year>`), not a hand-built key — so read it off
    // the live snapshot the year's query keeps warm.
    const row = this.budgets.value.find((b) => b.tagId === tagId)
    if (row === undefined) return
    this.repo.delete(row.id)
  }

  dispose(): void {
    this.yearSub?.unsubscribe()
    this.subs.unsubscribe()
  }

  /**
   * Points the live budget query at one fiscal year's partition. Subscribing
   * drives lazy hydration of that year's blob (a cold year reads empty until it
   * lands, then re-emits). The previous year's subscription is torn down first
   * so only the viewed partition stays warm.
   */
  private observeYear(year: number): void {
    this.yearSub?.unsubscribe()
    this.yearSub = this.repo.observeQuery({ keys: [budgetYearKey(year)] }).subscribe((rows) => {
      this.budgets.next(rows)
    })
    this.subs.add(this.yearSub)
  }
}

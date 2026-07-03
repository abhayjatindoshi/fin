/**
 * BriefingService — composes the monthly briefing Home renders (§11, §15). The
 * app-side wiring the pure engines assume exists: it rolls the selected fiscal
 * year's transactions into per-category spends, builds the `CalibrationData`
 * port, runs the calibration + attention engines, and projects the result into
 * a `BriefingView` for Home.
 *
 * Reactive: it recomputes whenever the selected year's transactions, the year's
 * budgets, the tag set, or the selected year change. It holds each input's
 * latest snapshot as a field and recomputes from stored state on any emit — no
 * re-subscribing mid-compute, no store handles beyond what the composed services
 * expose. A pure projection layer.
 *
 * The `CalibrationData` port resolves tag metadata (`type`/`flow`) from the
 * catalog + user tags directly, NOT from `TagView` (which drops calibration
 * metadata by design). System tags are never seeded into the repo — they live
 * as the `SYSTEM_TAGS` constant with parent→child `type`/`flow` already resolved
 * — so the port merges that constant with the live user-tag rows.
 */

import { BehaviorSubject, Subscription, combineLatest, switchMap } from "rxjs"
import type { FyreDb, BaseEntity, RepositoryType as Repository } from "@fyre-db/core"

import { tagEntity } from "@/entities/tag"
import type { Tag } from "@/entities/tag"
import { SYSTEM_TAGS } from "@/catalog/system-tags"
import { CalibrationEngine } from "@/services/calibration"
import type {
  CalibrationData,
  CalibrationTag,
  CalibrationBudget,
} from "@/services/calibration"
import { AttentionEngine } from "@/services/attention"
import type { Disposable, ReadonlySubject } from "@/services/types"
import type { SettingsService } from "@/services/settings-service"
import type { TransactionsService, TransactionRow } from "@/services/transactions-service"
import type { BudgetsService } from "@/services/budgets-service"
import { EMPTY_BRIEFING, type BriefingView } from "@/views/briefing-view"
import { rollUp, formatMonthKey, type TagMeta } from "./rollup"
import { buildBriefing } from "./compose"

type TagRow = Tag & BaseEntity

export class BriefingService implements Disposable {
  private readonly tagRepo: Repository<Tag>
  private readonly settings: SettingsService
  private readonly budgets: BudgetsService
  private readonly subs = new Subscription()

  // Latest input snapshots — recompute reads these, never the store directly.
  private userTags: readonly TagRow[] = []
  private transactions: readonly TransactionRow[] = []

  private readonly briefing = new BehaviorSubject<BriefingView>(EMPTY_BRIEFING)

  constructor(
    fyredb: FyreDb,
    deps: {
      readonly settings: SettingsService
      readonly transactions: TransactionsService
      readonly budgets: BudgetsService
    },
  ) {
    this.tagRepo = fyredb.repo(tagEntity)
    this.settings = deps.settings
    this.budgets = deps.budgets

    this.subs.add(
      this.tagRepo.observeQuery().subscribe((rows) => {
        this.userTags = rows
        this.recompute()
      }),
    )

    // The transactions stream re-points to the selected year's months via
    // `switchMap` over `monthKeys$`, so a year switch both hydrates the new
    // partitions and refreshes the briefing. Budgets + year drive recompute too.
    const transactionsForYear = this.settings.monthKeys$.pipe(
      switchMap((keys) => deps.transactions.observeMonths(keys)),
    )
    this.subs.add(
      combineLatest([
        transactionsForYear,
        this.budgets.budgets$,
        this.settings.selectedYear$,
      ]).subscribe(([txns]) => {
        this.transactions = txns
        this.recompute()
      }),
    )
  }

  // ── Exposes ──────────────────────────────────────────────
  /** The monthly briefing for the selected fiscal year, live. */
  get briefing$(): ReadonlySubject<BriefingView> {
    return this.briefing
  }

  dispose(): void {
    this.subs.unsubscribe()
  }

  /**
   * Recomputes the briefing from the latest input snapshots: roll up the year's
   * transactions, run the engines through the port, project to a `BriefingView`.
   * Pure over stored fields — safe to call on any input emit.
   */
  private recompute(): void {
    const monthKeys = this.settings.monthKeys$.value
    const tagsById = this.buildTagIndex()
    const { spends, thisMonthKey } = rollUp(this.transactions, monthKeys, tagsById)

    if (thisMonthKey === undefined) {
      this.briefing.next(EMPTY_BRIEFING)
      return
    }

    const data = this.buildPort()
    const calibration = new CalibrationEngine(data)
    const attention = new AttentionEngine(data)

    const strip = attention.compose(spends)
    const verdicts = calibration.calibrateMany(spends)
    const monthLabel = formatMonthKey(thisMonthKey, this.settings.settings$.value.locale)

    this.briefing.next(
      buildBriefing({ strip, verdicts, monthLabel, displayOf: (id) => this.displayOf(id) }),
    )
  }

  /** Flat tag index (system + user) with `type`/`flow` for rollup + the port. */
  private buildTagIndex(): ReadonlyMap<string, TagMeta> {
    const index = new Map<string, TagMeta>()
    for (const t of SYSTEM_TAGS) {
      index.set(t.id, { id: t.id, parent: t.parent, type: t.type, flow: t.flow })
    }
    for (const t of this.userTags) {
      index.set(t.id, { id: t.id, parent: t.parent, type: t.type, flow: t.flow })
    }
    return index
  }

  /**
   * The `CalibrationData` port over live state. `tag()` resolves from the merged
   * catalog + user rows (widened to `CalibrationTag`); `budget()` reads the
   * selected year's budgets the BudgetsService keeps warm.
   */
  private buildPort(): CalibrationData {
    const systemById = new Map(SYSTEM_TAGS.map((t) => [t.id, t]))
    const userById = new Map(this.userTags.map((t) => [t.id, t]))
    return {
      tag: (tagId: string): CalibrationTag | undefined => {
        const user = userById.get(tagId)
        if (user) return user
        const sys = systemById.get(tagId)
        /* v8 ignore next -- rolled-up category ids always resolve; defensive guard for a standalone port call */
        if (!sys) return undefined
        // System tags carry a stable id but no store identity; widen with a
        // synthetic BaseEntity so the engine's `Tag & BaseEntity` port is satisfied.
        return { ...SYNTHETIC_IDENTITY, ...sys }
      },
      budget: (tagId: string): CalibrationBudget | undefined => {
        const row = this.budgets.budgetFor(tagId)
        return row ? { ...SYNTHETIC_IDENTITY, ...row } : undefined
      },
    }
  }

  /** Display name + icon for a tagId, from the merged index (for the view). */
  private displayOf(tagId: string): { readonly name: string; readonly icon: string } {
    const user = this.userTags.find((t) => t.id === tagId)
    if (user) return { name: user.name, icon: user.icon }
    const sys = SYSTEM_TAGS.find((t) => t.id === tagId)
    /* v8 ignore next 2 -- every rolled-up category id resolves in the catalog or user tags; the placeholder is a defensive fallback */
    if (!sys) return { name: tagId, icon: "circle-help" }
    return { name: sys.name, icon: sys.icon }
  }
}

/**
 * A synthetic store identity for catalog-only system tags / budget rows read
 * through the port. The engines only read domain fields (`type`/`flow`/`amount`);
 * the `BaseEntity` shape is required by the port type but its values are inert.
 * Spread FIRST so real row fields (including a real `id`) always win.
 */
const SYNTHETIC_IDENTITY = {
  id: "",
  createdAt: new Date(0),
  updatedAt: new Date(0),
  version: 1,
  device: "system",
  hlc: { timestamp: 0, counter: 0, nodeId: "system" },
} as const

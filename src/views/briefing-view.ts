/**
 * BriefingView — the monthly briefing Home renders (§11, §15). The pure,
 * UI-facing projection of the calibration + attention pipeline: Home is a thin
 * renderer over this shape and never touches an engine or the store directly
 * (the layered-boundaries rule keeps service/engine access out of `pages`).
 *
 * The briefing answers two questions for the selected month:
 *   - "what wasn't like you" → `headlines` + `club` (the attention strip, §15)
 *   - "what did I ask you to watch" → `progress` (budgeted categories, Rule 1)
 * …and when the strip finds nothing adverse, the calm-month content
 * (`appreciations`, or a plain calm line) is a first-class answer (§9, §15.5).
 *
 * All amounts are signed minor units, ready for `<Money>`. Each row carries its
 * tag's display `name`/`icon` so Home renders without re-resolving the catalog.
 */

import type { BudgetPeriod } from "@/entities/budget"
import type { Money } from "@/entities/money"

/**
 * Which way is good for a category, as the view carries it. Structurally equal
 * to the calibration engine's `FlowDirection`, but redeclared here so the view
 * layer stays free of a service-layer import (the boundary DAG forbids
 * `views → services`). `floor` = a target/goal (more is better); `ceiling` = a
 * cap (less is better).
 */
export type BriefingDirection = "ceiling" | "floor"

/** A category that earned its own line on the attention strip (§15.3). */
export type BriefingHeadline = {
  readonly tagId: string
  readonly name: string
  readonly icon: string
  readonly direction: BriefingDirection
  readonly thisMonth: Money
  readonly expected: Money
  /** Signed ₹ gap; positive = over the baseline (the adverse direction here). */
  readonly deviationAmount: Money
  /** Signed fraction over expected (`+0.53` = 53% over). */
  readonly deviationFraction: number
  /** Non-negative rank currency (= |deviationAmount|). */
  readonly severity: Money
}

/** One member of the clubbed minor-mover tail (§15.3), enriched for display.
 *  Per-member ₹ isn't retained by the engine — the club is a tap-through
 *  summary carrying the count + combined total, so members are identity only. */
export type BriefingClubMember = {
  readonly tagId: string
  readonly name: string
  readonly icon: string
}

/** The folded tail of admitted-but-minor movers — a summary, never a truncation. */
export type BriefingClub = {
  readonly count: number
  readonly combinedAmount: Money
  readonly members: readonly BriefingClubMember[]
}

/** A favorable standout for the calm-month note (§15.5). */
export type BriefingAppreciation = {
  readonly tagId: string
  readonly name: string
  readonly icon: string
  /** Signed ₹ gap (negative = spent less on a ceiling — the good case). */
  readonly deviationAmount: Money
  readonly magnitude: Money
}

/** A budgeted category's raw progress toward its line (Rule 1 — always showable). */
export type BriefingProgress = {
  readonly tagId: string
  readonly name: string
  readonly icon: string
  readonly direction: BriefingDirection
  readonly spent: Money
  readonly budget: Money
  readonly period: BudgetPeriod
  /** 0..1+ fraction consumed. Raw progress; yearly pace is withheld (Rug 1). */
  readonly fraction: number
}

/**
 * The whole briefing for one month.
 *
 * - `hasData` false ⇒ the selected fiscal year has no transactions at all yet
 *   (a fresh household / empty year) — Home shows the get-started note, distinct
 *   from a calm month.
 * - `headlines` empty AND `club` undefined ⇒ a calm month (§9, §15.1): Home
 *   shows the good-month note (`appreciations`, or a plain calm line), never an
 *   empty state.
 * - `progress` is orthogonal to the strip — budgeted categories always show
 *   their bar, whether or not the month tripped an alert.
 */
export type BriefingView = {
  /** Human month label for the briefing, e.g. "November 2025". Empty when no data. */
  readonly monthLabel: string
  readonly hasData: boolean
  readonly headlines: readonly BriefingHeadline[]
  readonly club: BriefingClub | undefined
  readonly appreciations: readonly BriefingAppreciation[]
  readonly progress: readonly BriefingProgress[]
}

/** The empty briefing — no data yet. */
export const EMPTY_BRIEFING: BriefingView = {
  monthLabel: "",
  hasData: false,
  headlines: [],
  club: undefined,
  appreciations: [],
  progress: [],
}

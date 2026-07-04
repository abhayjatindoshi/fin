/**
 * Calibratable categories — the tags a user can draw a budget on (§13).
 *
 * Budgets and calibration reason **per parent category** (§2), so this is the
 * flat list of top-level system-tag categories, minus the ones that never carry
 * a verdict: `excluded` flow (self-transfer, cash, card-repay, shared) is
 * pre-gated out of every total (§13.2), so budgeting it is meaningless.
 *
 * Each entry carries its display fields plus the calibration `direction` read
 * off the tag's `flow` (`target` → floor / more-is-better, else ceiling), so the
 * budgets UI can label a target ("goal") differently from a cap without
 * re-deriving flow. Kept in the catalog layer because it's catalog knowledge;
 * the settings UI (a feature) can't reach tag `flow` through `TagView`.
 */

import { SYSTEM_TAGS } from "./system-tags"

/** Which way is good for a category — mirrors the calibration engine's
 *  `FlowDirection` without importing across the service boundary (catalog may
 *  not depend on services). `target` flow → floor; everything else → ceiling. */
export type CategoryDirection = "ceiling" | "floor"

/** A top-level category a budget can be drawn on. */
export type CalibratableCategory = {
  readonly id: string
  readonly name: string
  readonly icon: string
  /** `floor` = a target/goal (more is better); `ceiling` = a cap (less is better). */
  readonly direction: CategoryDirection
}

/**
 * The budgetable top-level categories, in catalog order. Roots only (no
 * `parent`), excluding `flow: "excluded"`. Direction is derived from `flow`
 * exactly as the calibration engine's `flowDirection` does.
 */
export const CALIBRATABLE_CATEGORIES: readonly CalibratableCategory[] = SYSTEM_TAGS.filter(
  (t) => t.parent === undefined && t.flow !== "excluded",
).map((t) => ({
  id: t.id,
  name: t.name,
  icon: t.icon,
  direction: t.flow === "target" ? "floor" : "ceiling",
}))

/**
 * Pure projection: engine outputs → `BriefingView`. Takes the attention strip
 * (adverse standouts + clubbed tail + calm-month appreciations) and the
 * calibration verdicts (for the budgeted-progress bars), enriches every row with
 * its tag's display name/icon, and returns the shape Home renders. No store, no
 * engines — just a deterministic mapping, so the projection is unit-testable.
 *
 * Progress rows come from the calibration verdicts (Rule 1), not the strip: a
 * budgeted category shows its bar whether or not the month tripped an alert, and
 * the strip deliberately routes budgeted categories off itself (they're the
 * progress surface, not the deviation surface — §15.4 / §3).
 */

import type { AttentionStrip } from "@/services/attention"
import type { CalibrationVerdict } from "@/services/calibration"
import type {
  BriefingView,
  BriefingHeadline,
  BriefingClub,
  BriefingAppreciation,
  BriefingProgress,
} from "@/views/briefing-view"

/** Display fields for a tag, resolved by the caller from the merged tag index. */
export type TagDisplay = { readonly name: string; readonly icon: string }

export type BuildBriefingInput = {
  readonly strip: AttentionStrip
  readonly verdicts: ReadonlyMap<string, CalibrationVerdict>
  readonly monthLabel: string
  readonly displayOf: (tagId: string) => TagDisplay
}

/**
 * Projects the engine outputs into the `BriefingView`. `hasData` is true here by
 * construction — the service only calls this once a judged month exists; the
 * no-data case short-circuits to `EMPTY_BRIEFING` upstream.
 */
export function buildBriefing(input: BuildBriefingInput): BriefingView {
  const { strip, verdicts, monthLabel, displayOf } = input

  const headlines: BriefingHeadline[] = strip.headlines.map((h) => ({
    tagId: h.tagId,
    ...displayOf(h.tagId),
    direction: h.direction,
    thisMonth: h.thisMonth,
    expected: h.expected,
    deviationAmount: h.deviationAmount,
    deviationFraction: h.deviationFraction,
    severity: h.severity,
  }))

  const club: BriefingClub | undefined =
    strip.club === undefined
      ? undefined
      : {
          count: strip.club.count,
          combinedAmount: strip.club.combinedAmount,
          members: strip.club.tagIds.map((tagId) => ({
            tagId,
            ...displayOf(tagId),
          })),
        }

  const appreciations: BriefingAppreciation[] = strip.appreciations.map((a) => ({
    tagId: a.tagId,
    ...displayOf(a.tagId),
    deviationAmount: a.deviationAmount,
    magnitude: a.magnitude,
  }))

  // Budgeted-progress bars from the calibration verdicts (Rule 1). Sorted by
  // fraction descending so the closest-to-the-line categories lead.
  const progress: BriefingProgress[] = []
  for (const verdict of verdicts.values()) {
    if (verdict.kind !== "progress") continue
    progress.push({
      tagId: verdict.tagId,
      ...displayOf(verdict.tagId),
      direction: verdict.direction,
      spent: verdict.spent,
      budget: verdict.budget,
      period: verdict.period,
      fraction: verdict.fraction,
    })
  }
  progress.sort((a, b) => b.fraction - a.fraction)

  return {
    monthLabel,
    hasData: true,
    headlines,
    club,
    appreciations,
    progress,
  }
}

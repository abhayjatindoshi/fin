import { describe, it, expect } from "vitest"
import { buildBriefing } from "@/services/briefing/compose"
import type { AttentionStrip } from "@/services/attention"
import type { CalibrationVerdict } from "@/services/calibration"

/**
 * The pure projection engine-outputs → `BriefingView`. Pins that the strip's
 * headlines/club/appreciations and the calibration progress verdicts are each
 * enriched with display fields and mapped into the shape Home renders — and that
 * progress comes from the verdicts (not the strip), sorted closest-to-line first.
 */

const DISPLAY: Record<string, { name: string; icon: string }> = {
  "system-tag-house": { name: "House", icon: "house" },
  "system-tag-food": { name: "Food", icon: "utensils" },
  "system-tag-commute": { name: "Commute", icon: "car-front" },
  "system-tag-investments": { name: "Investments", icon: "chart-candlestick" },
  "system-tag-groceries": { name: "Groceries", icon: "grape" },
}
const displayOf = (id: string): { name: string; icon: string } =>
  DISPLAY[id] ?? { name: id, icon: "circle-help" }

const EMPTY_STRIP: AttentionStrip = { headlines: [], club: undefined, appreciations: [] }

describe("buildBriefing", () => {
  it("maps a headline with its display name/icon and deviation figures", () => {
    const strip: AttentionStrip = {
      headlines: [
        {
          tagId: "system-tag-house",
          type: "Fixed",
          direction: "ceiling",
          thisMonth: 25000_00,
          expected: 20000_00,
          deviationFraction: 0.25,
          deviationAmount: 5000_00,
          severity: 5000_00,
        },
      ],
      club: undefined,
      appreciations: [],
    }

    const view = buildBriefing({ strip, verdicts: new Map(), monthLabel: "November 2025", displayOf })

    expect(view.hasData).toBe(true)
    expect(view.monthLabel).toBe("November 2025")
    expect(view.headlines).toHaveLength(1)
    expect(view.headlines[0]).toEqual({
      tagId: "system-tag-house",
      name: "House",
      icon: "house",
      direction: "ceiling",
      thisMonth: 25000_00,
      expected: 20000_00,
      deviationAmount: 5000_00,
      deviationFraction: 0.25,
      severity: 5000_00,
    })
  })

  it("maps the clubbed tail into a count + combined total + named members", () => {
    const strip: AttentionStrip = {
      headlines: [],
      club: {
        count: 2,
        combinedAmount: 1400_00,
        tagIds: ["system-tag-food", "system-tag-commute"],
      },
      appreciations: [],
    }

    const view = buildBriefing({ strip, verdicts: new Map(), monthLabel: "Nov 2025", displayOf })

    expect(view.club).toEqual({
      count: 2,
      combinedAmount: 1400_00,
      members: [
        { tagId: "system-tag-food", name: "Food", icon: "utensils" },
        { tagId: "system-tag-commute", name: "Commute", icon: "car-front" },
      ],
    })
  })

  it("leaves club undefined when nothing was clubbed", () => {
    const view = buildBriefing({ strip: EMPTY_STRIP, verdicts: new Map(), monthLabel: "Nov", displayOf })
    expect(view.club).toBeUndefined()
  })

  it("maps calm-month appreciations with display fields", () => {
    const strip: AttentionStrip = {
      headlines: [],
      club: undefined,
      appreciations: [
        { tagId: "system-tag-food", direction: "ceiling", deviationAmount: -3000_00, magnitude: 3000_00 },
      ],
    }

    const view = buildBriefing({ strip, verdicts: new Map(), monthLabel: "Nov", displayOf })

    expect(view.appreciations).toEqual([
      {
        tagId: "system-tag-food",
        name: "Food",
        icon: "utensils",
        deviationAmount: -3000_00,
        magnitude: 3000_00,
      },
    ])
  })

  it("builds progress rows from progress verdicts, sorted closest-to-line first", () => {
    const verdicts = new Map<string, CalibrationVerdict>([
      [
        "system-tag-groceries",
        {
          kind: "progress",
          tagId: "system-tag-groceries",
          rule: "budgeted-direct",
          direction: "ceiling",
          spent: 4000_00,
          budget: 10000_00,
          period: "monthly",
          fraction: 0.4,
        },
      ],
      [
        "system-tag-investments",
        {
          kind: "progress",
          tagId: "system-tag-investments",
          rule: "budgeted-direct",
          direction: "floor",
          spent: 90000_00,
          budget: 100000_00,
          period: "yearly",
          fraction: 0.9,
        },
      ],
      // Non-progress verdicts must be ignored by the progress projection.
      ["system-tag-food", { kind: "silent", tagId: "system-tag-food", rule: "frequent" }],
      [
        "system-tag-house",
        {
          kind: "alert",
          tagId: "system-tag-house",
          rule: "committed",
          comparison: "above",
          direction: "ceiling",
          deviation: 0.25,
          severity: 0.25,
          thisMonth: 25000_00,
          expected: 20000_00,
        },
      ],
    ])

    const view = buildBriefing({ strip: EMPTY_STRIP, verdicts, monthLabel: "Nov", displayOf })

    expect(view.progress).toHaveLength(2)
    // 0.9 (investments) ranks before 0.4 (groceries).
    expect(view.progress.map((p) => p.tagId)).toEqual([
      "system-tag-investments",
      "system-tag-groceries",
    ])
    expect(view.progress[0]).toEqual({
      tagId: "system-tag-investments",
      name: "Investments",
      icon: "chart-candlestick",
      direction: "floor",
      spent: 90000_00,
      budget: 100000_00,
      period: "yearly",
      fraction: 0.9,
    })
  })

  it("returns an all-empty (but hasData) briefing when the strip and verdicts are empty", () => {
    const view = buildBriefing({ strip: EMPTY_STRIP, verdicts: new Map(), monthLabel: "Nov", displayOf })
    expect(view).toEqual({
      monthLabel: "Nov",
      hasData: true,
      headlines: [],
      club: undefined,
      appreciations: [],
      progress: [],
    })
  })
})

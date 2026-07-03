import { describe, it, expect } from "vitest"
import { rollUp, categoryOf, formatMonthKey, type TagMeta } from "@/services/briefing/rollup"
import { fiscalYearMonthKeys } from "@/lib/fiscal"

/**
 * The pure spend-rollup that feeds the calibration + attention engines. These
 * pin the load-bearing rollup rules (docs/baseline-calibration-design.md):
 * per-parent aggregation (§2), excluded-flow + self-transfer + untagged drops
 * (§13.2), signed-magnitude netting, and active-month trailing selection (§9).
 */

// FY 2025–26 (April start) → Apr'25 … Mar'26.
const MONTH_KEYS = fiscalYearMonthKeys(2025, 4)

const TAGS = new Map<string, TagMeta>([
  ["system-tag-food", { id: "system-tag-food", type: "Everyday" }],
  ["system-tag-food-swiggy", { id: "system-tag-food-swiggy", parent: "system-tag-food" }],
  ["system-tag-house", { id: "system-tag-house", type: "Fixed" }],
  ["system-tag-house-rentpaid", { id: "system-tag-house-rentpaid", parent: "system-tag-house" }],
  ["system-tag-selftransfer", { id: "system-tag-selftransfer", flow: "excluded" }],
])

/** UTC ms for a fiscal-year date. */
const at = (y: number, m: number, d: number): number => Date.UTC(y, m - 1, d)

describe("categoryOf", () => {
  it("returns undefined for an untagged row", () => {
    expect(categoryOf(undefined, TAGS)).toBeUndefined()
  })

  it("returns undefined for an unknown tag id (e.g. a synthetic account tag)", () => {
    expect(categoryOf("account-abc123", TAGS)).toBeUndefined()
  })

  it("rolls a child up to its parent category", () => {
    expect(categoryOf("system-tag-food-swiggy", TAGS)).toBe("system-tag-food")
  })

  it("maps a root tag to itself", () => {
    expect(categoryOf("system-tag-food", TAGS)).toBe("system-tag-food")
  })
})

describe("rollUp", () => {
  it("aggregates a child under its parent and judges the last active month", () => {
    const rollup = rollUp(
      [
        { tagId: "system-tag-food", transactionAt: at(2025, 4, 10), amount: -15000_00 },
        { tagId: "system-tag-food-swiggy", transactionAt: at(2025, 5, 10), amount: -14000_00 },
        { tagId: "system-tag-food", transactionAt: at(2025, 6, 10), amount: -16000_00 },
        { tagId: "system-tag-food", transactionAt: at(2025, 7, 10), amount: -23000_00 },
      ],
      MONTH_KEYS,
      TAGS,
    )

    expect(rollup.thisMonthKey, "judges the latest month with data").toBe("2025-07")
    expect(rollup.spends).toHaveLength(1)
    const food = rollup.spends[0]
    expect(food.tagId).toBe("system-tag-food")
    expect(food.thisMonth, "this month's magnitude").toBe(23000_00)
    expect(food.trailing, "trailing months, most-recent-last").toEqual([15000_00, 14000_00, 16000_00])
    expect(food.yearToDate, "signed magnitude across the FY").toBe(68000_00)
  })

  it("drops excluded-flow, self-transfer, and untagged rows before totals", () => {
    const rollup = rollUp(
      [
        { tagId: "system-tag-food", transactionAt: at(2025, 4, 10), amount: -12000_00 },
        { tagId: "system-tag-food", transactionAt: at(2025, 5, 10), amount: -13000_00 },
        // excluded flow — self-transfer root
        { tagId: "system-tag-selftransfer", transactionAt: at(2025, 5, 12), amount: -50000_00 },
        // synthetic account tag (not in index) — unknown, dropped
        { tagId: "account-hdfc-1", transactionAt: at(2025, 5, 12), amount: -40000_00 },
        // untagged
        { tagId: undefined, transactionAt: at(2025, 5, 13), amount: -999_00 },
      ],
      MONTH_KEYS,
      TAGS,
    )

    expect(rollup.spends, "only Food survives").toHaveLength(1)
    expect(rollup.spends[0].tagId).toBe("system-tag-food")
  })

  it("nets signed amounts within a category+month (a refund cancels a charge)", () => {
    // April: paid 20k then refunded 20k → net 0, but April IS an active month.
    const rollup = rollUp(
      [
        { tagId: "system-tag-house-rentpaid", transactionAt: at(2025, 4, 5), amount: -20000_00 },
        { tagId: "system-tag-house-rentpaid", transactionAt: at(2025, 4, 6), amount: 20000_00 },
        { tagId: "system-tag-house", transactionAt: at(2025, 5, 5), amount: -20000_00 },
        { tagId: "system-tag-house", transactionAt: at(2025, 6, 5), amount: -20000_00 },
      ],
      MONTH_KEYS,
      TAGS,
    )

    expect(rollup.thisMonthKey).toBe("2025-06")
    const house = rollup.spends[0]
    // April kept as a real zero (it had activity) — honestly drags the median.
    expect(house.trailing).toEqual([0, 20000_00])
    expect(house.thisMonth).toBe(20000_00)
    expect(house.yearToDate).toBe(40000_00)
  })

  it("skips fiscal months with no data (no leading-empty dilution)", () => {
    // Only May has data → judged May, no trailing (Apr never happened / imported).
    const rollup = rollUp(
      [{ tagId: "system-tag-food", transactionAt: at(2025, 5, 10), amount: -100_00 }],
      MONTH_KEYS,
      TAGS,
    )
    expect(rollup.thisMonthKey).toBe("2025-05")
    expect(rollup.spends[0].trailing, "no active month precedes May").toEqual([])
    expect(rollup.spends[0].thisMonth).toBe(100_00)
  })

  it("ignores transactions outside the selected fiscal year", () => {
    // March 2025 is before the April 2025 FY start — must not count.
    const rollup = rollUp(
      [
        { tagId: "system-tag-food", transactionAt: at(2025, 3, 10), amount: -9999_00 },
        { tagId: "system-tag-food", transactionAt: at(2025, 5, 10), amount: -100_00 },
      ],
      MONTH_KEYS,
      TAGS,
    )
    expect(rollup.thisMonthKey).toBe("2025-05")
    expect(rollup.spends[0].trailing).toEqual([])
  })

  it("returns no judged month for an empty year", () => {
    expect(rollUp([], MONTH_KEYS, TAGS)).toEqual({ spends: [], thisMonthKey: undefined })
  })

  it("fills a zero for a category absent in one of the active months", () => {
    // Two categories: Food is in every month; House only in Apr + Jun. When Jul
    // becomes the judged month (via Food), House's trailing must carry a 0 for
    // the May slot it had no activity in — the `?? 0` gap fill.
    const rollup = rollUp(
      [
        { tagId: "system-tag-food", transactionAt: at(2025, 4, 1), amount: -1000_00 },
        { tagId: "system-tag-food", transactionAt: at(2025, 5, 1), amount: -1000_00 },
        { tagId: "system-tag-food", transactionAt: at(2025, 6, 1), amount: -1000_00 },
        { tagId: "system-tag-food", transactionAt: at(2025, 7, 1), amount: -1000_00 },
        { tagId: "system-tag-house", transactionAt: at(2025, 4, 5), amount: -20000_00 },
        { tagId: "system-tag-house", transactionAt: at(2025, 6, 5), amount: -20000_00 },
      ],
      MONTH_KEYS,
      TAGS,
    )
    expect(rollup.thisMonthKey).toBe("2025-07")
    const house = rollup.spends.find((s) => s.tagId === "system-tag-house")
    // Active months are Apr,May,Jun,Jul; trailing = Apr,May,Jun. House: 20k, 0, 20k.
    expect(house?.trailing).toEqual([20000_00, 0, 20000_00])
    expect(house?.thisMonth, "House had no July activity → 0").toBe(0)
    expect(house?.yearToDate).toBe(40000_00)
  })

  it("returns no judged month when every row is excluded", () => {
    const rollup = rollUp(
      [{ tagId: "system-tag-selftransfer", transactionAt: at(2025, 5, 1), amount: -1000_00 }],
      MONTH_KEYS,
      TAGS,
    )
    expect(rollup.thisMonthKey, "no included activity ⇒ nothing to judge").toBeUndefined()
    expect(rollup.spends).toEqual([])
  })
})

describe("formatMonthKey", () => {
  it("renders a YYYY-MM key as a full month + year label", () => {
    expect(formatMonthKey("2025-11", "en-US")).toBe("November 2025")
  })

  it("uses UTC so the month never slips across a timezone boundary", () => {
    // 2025-01 must read January, not December of the prior year.
    expect(formatMonthKey("2025-01", "en-US")).toBe("January 2025")
  })
})

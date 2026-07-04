import { describe, it, expect } from "vitest"
import { CALIBRATABLE_CATEGORIES } from "@/catalog/calibratable-categories"
import { SYSTEM_TAGS } from "@/catalog/system-tags"

/**
 * The budgetable-category derivation (§13). A user can draw a budget on any
 * top-level category EXCEPT the excluded-flow ones (self-transfer, cash,
 * card-repay, shared) — those never carry a verdict, so budgeting them is
 * meaningless. Direction is read off `flow` exactly as the engine does.
 */

describe("CALIBRATABLE_CATEGORIES", () => {
  it("contains only top-level categories (no children)", () => {
    const rootIds = new Set(SYSTEM_TAGS.filter((t) => t.parent === undefined).map((t) => t.id))
    for (const c of CALIBRATABLE_CATEGORIES) {
      expect(rootIds.has(c.id), `${c.id} must be a root category`).toBe(true)
    }
  })

  it("excludes every excluded-flow category", () => {
    const excludedIds = new Set(
      SYSTEM_TAGS.filter((t) => t.flow === "excluded").map((t) => t.id),
    )
    for (const c of CALIBRATABLE_CATEGORIES) {
      expect(excludedIds.has(c.id), `${c.id} is excluded-flow and must not be budgetable`).toBe(false)
    }
    // And a known excluded one is genuinely absent.
    expect(CALIBRATABLE_CATEGORIES.some((c) => c.id === "system-tag-selftransfer")).toBe(false)
  })

  it("marks target-flow categories as floors and the rest as ceilings", () => {
    const income = CALIBRATABLE_CATEGORIES.find((c) => c.id === "system-tag-income")
    const investments = CALIBRATABLE_CATEGORIES.find((c) => c.id === "system-tag-investments")
    const food = CALIBRATABLE_CATEGORIES.find((c) => c.id === "system-tag-food")

    expect(income?.direction, "income is a floor (more is better)").toBe("floor")
    expect(investments?.direction, "investments is a floor").toBe("floor")
    expect(food?.direction, "food is a ceiling (less is better)").toBe("ceiling")
  })

  it("carries display name + icon from the catalog", () => {
    const food = CALIBRATABLE_CATEGORIES.find((c) => c.id === "system-tag-food")
    expect(food?.name).toBe("Food")
    expect(food?.icon).toBe("utensils")
  })

  it("preserves catalog order", () => {
    const budgetableRoots = SYSTEM_TAGS.filter(
      (t) => t.parent === undefined && t.flow !== "excluded",
    ).map((t) => t.id)
    expect(CALIBRATABLE_CATEGORIES.map((c) => c.id)).toEqual(budgetableRoots)
  })
})

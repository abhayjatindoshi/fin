import { describe, it, expect, afterEach, vi } from "vitest"
import type { FyreDb } from "@fyre-db/core"
import { createTestFyreDb } from "../helpers/test-fyredb"
import { BudgetsService } from "@/services/budgets-service"
import { SettingsService } from "@/services/settings-service"
import { budgetEntity } from "@/entities/budget"

/**
 * BudgetsService — the per-tenant budget store scoped to the selected fiscal
 * year. Verifies the year-partitioned reactive reads, the set/remove ops, and
 * the §13.4 xor (one budget per tag per year: monthly-then-yearly upserts the
 * same row). Uses a real in-memory FyreDb so partitioning + deriveId behave as
 * in production.
 */
describe("BudgetsService", () => {
  let fyredb: FyreDb
  let settings: SettingsService
  let svc: BudgetsService

  afterEach(async () => {
    svc.dispose()
    settings.dispose()
    await fyredb.dispose().catch(() => {})
  })

  async function setup(): Promise<void> {
    fyredb = await createTestFyreDb()
    settings = new SettingsService(fyredb)
    svc = new BudgetsService(fyredb, settings)
  }

  it("starts with no budgets for a fresh year", async () => {
    await setup()
    expect(svc.budgets$.value).toEqual([])
    expect(svc.budgetFor("system-tag-food")).toBeUndefined()
  })

  it("sets a budget for the selected year and reflects it on budgets$", async () => {
    await setup()
    const year = settings.selectedYear$.value

    svc.set({ tagId: "system-tag-food", amount: 12000_00, period: "monthly" })

    await vi.waitFor(() => {
      const row = svc.budgetFor("system-tag-food")
      expect(row?.amount).toBe(12000_00)
    })
    const row = svc.budgetFor("system-tag-food")
    expect(row?.year, "budget carries the selected fiscal year").toBe(year)
    expect(row?.period).toBe("monthly")
    // id is the composite tagId:year (checked via the store, which namespaces
    // the partitioned id as `budget.<year>.<tagId>:<year>`).
    expect(fyredb.repo(budgetEntity).get(`budget.${year}.system-tag-food:${year}`)?.amount).toBe(12000_00)
  })

  it("upserts the same row when switching a tag from monthly to yearly (the xor)", async () => {
    await setup()

    svc.set({ tagId: "system-tag-investments", amount: 5000_00, period: "monthly" })
    await vi.waitFor(() => { expect(svc.budgetFor("system-tag-investments")).toBeDefined() })

    svc.set({ tagId: "system-tag-investments", amount: 100000_00, period: "yearly" })
    await vi.waitFor(() => {
      expect(svc.budgetFor("system-tag-investments")?.period).toBe("yearly")
    })

    // Exactly one row for the tag — the second set replaced the first.
    const forTag = svc.budgets$.value.filter((b) => b.tagId === "system-tag-investments")
    expect(forTag).toHaveLength(1)
    expect(forTag[0].amount).toBe(100000_00)
  })

  it("removes a budget", async () => {
    await setup()
    svc.set({ tagId: "system-tag-food", amount: 12000_00, period: "monthly" })
    await vi.waitFor(() => { expect(svc.budgetFor("system-tag-food")).toBeDefined() })

    svc.remove("system-tag-food")

    await vi.waitFor(() => { expect(svc.budgetFor("system-tag-food")).toBeUndefined() })
  })

  it("remove is a no-op when the tag has no budget", async () => {
    await setup()
    // No throw, no write — nothing to delete.
    expect(() => { svc.remove("system-tag-food") }).not.toThrow()
    expect(svc.budgets$.value).toEqual([])
  })

  it("re-scopes to a different year's partition when the selected year changes", async () => {
    await setup()
    const y1 = settings.selectedYear$.value
    svc.set({ tagId: "system-tag-food", amount: 12000_00, period: "monthly" })
    await vi.waitFor(() => { expect(svc.budgetFor("system-tag-food")).toBeDefined() })

    // Move to a different year — the live query re-points; that year is empty.
    settings.setSelectedYear(y1 + 1)
    await vi.waitFor(() => { expect(svc.budgetFor("system-tag-food")).toBeUndefined() })
    expect(svc.budgets$.value).toEqual([])

    // A budget set now lands in the NEW year.
    svc.set({ tagId: "system-tag-food", amount: 15000_00, period: "monthly" })
    await vi.waitFor(() => { expect(svc.budgetFor("system-tag-food")?.amount).toBe(15000_00) })
    expect(fyredb.repo(budgetEntity).get(`budget.${y1 + 1}.system-tag-food:${y1 + 1}`)?.amount).toBe(15000_00)

    // Switching back shows the original year's budget again.
    settings.setSelectedYear(y1)
    await vi.waitFor(() => { expect(svc.budgetFor("system-tag-food")?.amount).toBe(12000_00) })
  })
})

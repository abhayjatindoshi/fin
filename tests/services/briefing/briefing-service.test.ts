import { describe, it, expect, afterEach, vi } from "vitest"
import type { FyreDb } from "@fyre-db/core"
import { createTestFyreDb } from "../../helpers/test-fyredb"
import { BriefingService } from "@/services/briefing"
import { SettingsService } from "@/services/settings-service"
import { TransactionsService } from "@/services/transactions-service"
import { BudgetsService } from "@/services/budgets-service"
import { transactionEntity, tagEntity } from "@/entities"
import type { Transaction } from "@/entities"

/**
 * BriefingService — the orchestrator that rolls the selected year's
 * transactions through the calibration + attention engines into a
 * `BriefingView`. Uses a real in-memory FyreDb and drives the pipeline by
 * seeding transactions + budgets, then asserting the projected briefing.
 *
 * The default fiscal year (April start) is the current one; tests seed into it
 * via the settings-derived month keys so the rollup picks the data up.
 */
describe("BriefingService", () => {
  let fyredb: FyreDb
  let settings: SettingsService
  let transactions: TransactionsService
  let budgets: BudgetsService
  let svc: BriefingService

  afterEach(async () => {
    svc.dispose()
    budgets.dispose()
    transactions.dispose()
    settings.dispose()
    await fyredb.dispose().catch(() => {})
  })

  async function setup(): Promise<void> {
    fyredb = await createTestFyreDb()
    settings = new SettingsService(fyredb)
    transactions = new TransactionsService(fyredb)
    budgets = new BudgetsService(fyredb, settings)
    svc = new BriefingService(fyredb, { settings, transactions, budgets })
  }

  /** A month key within the selected fiscal year, `offset` months from its start. */
  function fyMonth(offset: number): { year: number; month: number } {
    const keys = settings.monthKeys$.value // YYYY-MM in fiscal order
    const [y, m] = keys[offset].split("-").map(Number)
    return { year: y, month: m }
  }

  function saveTx(over: Partial<Transaction> & { hash: string; monthOffset: number }): void {
    const { year, month } = fyMonth(over.monthOffset)
    const repo = fyredb.repo(transactionEntity)
    repo.save({
      accountId: "acc-1",
      narration: over.narration ?? "TXN",
      transactionAt: Date.UTC(year, month - 1, 10),
      amount: over.amount ?? -1000_00,
      hash: over.hash,
      tagId: over.tagId,
    })
  }

  it("reports no data for an empty year", async () => {
    await setup()
    await vi.waitFor(() => {
      expect(svc.briefing$.value.hasData).toBe(false)
    })
    expect(svc.briefing$.value.headlines).toEqual([])
    expect(svc.briefing$.value.monthLabel).toBe("")
  })

  it("flags an Everyday category running hot as a headline", async () => {
    await setup()
    // Food (Everyday): 15k, 14k, 16k trailing → 23k this month (+53%).
    saveTx({ hash: "f1", monthOffset: 0, tagId: "system-tag-food", amount: -15000_00 })
    saveTx({ hash: "f2", monthOffset: 1, tagId: "system-tag-food", amount: -14000_00 })
    saveTx({ hash: "f3", monthOffset: 2, tagId: "system-tag-food", amount: -16000_00 })
    saveTx({ hash: "f4", monthOffset: 3, tagId: "system-tag-food", amount: -23000_00 })

    await vi.waitFor(() => {
      expect(svc.briefing$.value.hasData).toBe(true)
      const h = svc.briefing$.value.headlines
      expect(h.length, "food should headline").toBeGreaterThanOrEqual(1)
      expect(h[0].tagId).toBe("system-tag-food")
    })
    const headline = svc.briefing$.value.headlines[0]
    expect(headline.name).toBe("Food")
    expect(headline.thisMonth).toBe(23000_00)
    expect(headline.expected).toBe(15000_00) // median(15,14,16)
    expect(headline.deviationAmount).toBe(8000_00)
  })

  it("is a calm month when nothing deviates", async () => {
    await setup()
    // Flat food — no deviation.
    saveTx({ hash: "c1", monthOffset: 0, tagId: "system-tag-food", amount: -15000_00 })
    saveTx({ hash: "c2", monthOffset: 1, tagId: "system-tag-food", amount: -15000_00 })
    saveTx({ hash: "c3", monthOffset: 2, tagId: "system-tag-food", amount: -15000_00 })

    await vi.waitFor(() => { expect(svc.briefing$.value.hasData).toBe(true) })
    expect(svc.briefing$.value.headlines).toEqual([])
    expect(svc.briefing$.value.club).toBeUndefined()
  })

  it("shows a budgeted category as a progress row (Rule 1)", async () => {
    await setup()
    saveTx({ hash: "g1", monthOffset: 0, tagId: "system-tag-groceries", amount: -4000_00 })
    budgets.set({ tagId: "system-tag-groceries", amount: 10000_00, period: "monthly" })

    await vi.waitFor(() => {
      const p = svc.briefing$.value.progress
      expect(p.some((r) => r.tagId === "system-tag-groceries")).toBe(true)
    })
    const row = svc.briefing$.value.progress.find((r) => r.tagId === "system-tag-groceries")
    expect(row?.name).toBe("Groceries")
    expect(row?.budget).toBe(10000_00)
    expect(row?.spent).toBe(4000_00)
    expect(row?.fraction).toBeCloseTo(0.4, 5)
  })

  it("resolves display for a user tag not in the system catalog", async () => {
    await setup()
    const tagRepo = fyredb.repo(tagEntity)
    // A user tag with its own calibration metadata (Everyday ceiling).
    const userTagId = tagRepo.save({ name: "Coffee Runs", icon: "coffee", type: "Everyday" })

    saveTx({ hash: "u1", monthOffset: 0, tagId: userTagId, amount: -2000_00 })
    saveTx({ hash: "u2", monthOffset: 1, tagId: userTagId, amount: -2000_00 })
    saveTx({ hash: "u3", monthOffset: 2, tagId: userTagId, amount: -2000_00 })
    // +₹7,000 over the ₹2,000 baseline clears the Everyday ₹5,000 HEADLINE line.
    saveTx({ hash: "u4", monthOffset: 3, tagId: userTagId, amount: -9000_00 })

    await vi.waitFor(() => {
      const h = svc.briefing$.value.headlines
      expect(h.some((x) => x.tagId === userTagId)).toBe(true)
    })
    const headline = svc.briefing$.value.headlines.find((x) => x.tagId === userTagId)
    expect(headline?.name, "user tag name resolves through the port").toBe("Coffee Runs")
    expect(headline?.icon).toBe("coffee")
  })

  it("excludes self-transfer rows from the briefing", async () => {
    await setup()
    // Only self-transfers → no included activity → still no data to brief.
    saveTx({ hash: "s1", monthOffset: 0, tagId: "system-tag-selftransfer", amount: -50000_00 })

    await vi.waitFor(() => {
      // The tag subscription + tx subscription have both fired.
      expect(svc.briefing$.value).toBeDefined()
    })
    // No non-excluded activity ⇒ hasData false.
    expect(svc.briefing$.value.hasData).toBe(false)
  })
})

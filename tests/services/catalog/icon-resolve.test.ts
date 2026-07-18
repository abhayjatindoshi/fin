import { describe, it, expect } from "vitest"
import { accountIconName, tagIconName } from "@/catalog/icon-resolve"
import { BANK_DISPLAY, KIND_DISPLAY } from "@/catalog/bank-display"
import type { TagView } from "@/views/tag-view"

describe("accountIconName", () => {
  it("prefers an explicit icon override", () => {
    expect(accountIconName({ icon: "star", kind: "bank" })).toBe("star")
  })

  it("uses the bank brand icon when the bank is known", () => {
    expect(accountIconName({ bankId: "hdfc", kind: "bank" })).toBe(BANK_DISPLAY.hdfc.icon)
  })

  it("falls back to the kind icon when the bank is unknown", () => {
    expect(accountIconName({ bankId: "not-a-bank", kind: "cash" })).toBe(KIND_DISPLAY.cash.icon)
  })

  it("uses the kind icon when there is no bank", () => {
    expect(accountIconName({ kind: "loan" })).toBe(KIND_DISPLAY.loan.icon)
  })
})

describe("tagIconName", () => {
  const base: TagView = { id: "t1", name: "Food", icon: "utensils" }

  it("uses the tag's own icon for a normal tag", () => {
    expect(tagIconName(base)).toBe("utensils")
  })

  it("resolves through the account chain for a synthetic account tag", () => {
    const tag: TagView = { ...base, account: { bankId: "hdfc", kind: "bank" } }
    expect(tagIconName(tag)).toBe(BANK_DISPLAY.hdfc.icon)
  })
})

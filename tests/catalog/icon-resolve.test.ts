import { describe, it, expect } from "vitest"
import { accountIconName, tagIconName } from "@/catalog/icon-resolve"
import type { AccountIconData } from "@/views/account-icon-data"
import type { TagView } from "@/views/tag-view"

/**
 * `icon-resolve` is the single pure resolver behind every account/tag icon. It
 * encodes the fallback chain — explicit override → bank brand mark → generic
 * kind icon — that both raw rows and view-models rely on, so each rung (and the
 * synthetic-account tag branch) is pinned here against real catalog data.
 */
describe("accountIconName", () => {
  it("prefers an explicit icon override above everything else", () => {
    const account: AccountIconData = { icon: "star", bankId: "hdfc", kind: "bank" }
    expect(accountIconName(account)).toBe("star")
  })

  it("falls back to the bank brand mark when no override but the bank is known", () => {
    const account: AccountIconData = { bankId: "hdfc", kind: "bank" }
    expect(accountIconName(account)).toBe("bank-hdfc")
  })

  it("falls through an unknown bankId to the generic kind icon", () => {
    const account: AccountIconData = { bankId: "not-a-bank", kind: "cash" }
    expect(accountIconName(account)).toBe("wallet")
  })

  it("uses the generic kind icon when there is no override and no bankId", () => {
    const account: AccountIconData = { kind: "bank" }
    expect(accountIconName(account)).toBe("landmark")
  })
})

describe("tagIconName", () => {
  it("resolves synthetic account tags through the account fallback chain", () => {
    const tag = {
      icon: "tag",
      account: { bankId: "hdfc", kind: "bank" } satisfies AccountIconData,
    } as unknown as TagView
    expect(tagIconName(tag)).toBe("bank-hdfc")
  })

  it("uses the tag's own icon for non-account tags", () => {
    const tag = { icon: "utensils", account: undefined } as unknown as TagView
    expect(tagIconName(tag)).toBe("utensils")
  })
})

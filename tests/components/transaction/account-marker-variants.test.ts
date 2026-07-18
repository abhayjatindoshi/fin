import { describe, it, expect } from "vitest"
import { ACCOUNT_MARKER_VARIANTS } from "@/components/transaction/account-marker-variants"

describe("ACCOUNT_MARKER_VARIANTS", () => {
  it("enumerates every account-marker variant with no duplicates", () => {
    expect(ACCOUNT_MARKER_VARIANTS).toEqual([
      "current",
      "icon",
      "last4",
      "pill",
      "avatar",
      "slang",
      "layered",
    ])
    expect(new Set(ACCOUNT_MARKER_VARIANTS).size).toBe(ACCOUNT_MARKER_VARIANTS.length)
  })
})

import { describe, it, expect } from "vitest"
import { transactionRowFrame } from "@/components/transaction/transaction-row-frame"

describe("transactionRowFrame", () => {
  it("includes the shared base classes with no flags", () => {
    const cls = transactionRowFrame()
    expect(cls).toContain("flex")
    expect(cls).toContain("min-h-12")
    expect(cls).toContain("border-x")
    expect(cls).not.toContain("rounded-t-lg")
    expect(cls).not.toContain("border-t")
    expect(cls).not.toContain("rounded-b-lg")
    expect(cls).not.toContain("bg-secondary/80")
  })

  it("rounds and adds a top border for the first row", () => {
    const cls = transactionRowFrame(true)
    expect(cls).toContain("rounded-t-lg")
    expect(cls).toContain("border-t")
  })

  it("rounds the bottom for the last row", () => {
    const cls = transactionRowFrame(false, true)
    expect(cls).toContain("rounded-b-lg")
  })

  it("applies the selected background", () => {
    const cls = transactionRowFrame(false, false, true)
    expect(cls).toContain("bg-secondary/80")
  })

  it("combines all flags for a single selected row", () => {
    const cls = transactionRowFrame(true, true, true)
    expect(cls).toContain("rounded-t-lg")
    expect(cls).toContain("border-t")
    expect(cls).toContain("rounded-b-lg")
    expect(cls).toContain("bg-secondary/80")
  })
})

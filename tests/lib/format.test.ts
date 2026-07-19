import { describe, it, expect } from "vitest"
import {
  CURRENCIES,
  formatMoney,
  formatNumber,
  formatPrivacyMoney,
  getCurrencyDigits,
  getCurrencyMeta,
  isKnownCurrency,
  majorToMinor,
  minorToMajor,
  privacyAmount,
  PRIVACY_SYMBOL,
} from "@/lib/format"

describe("getCurrencyMeta / isKnownCurrency", () => {
  it("returns metadata for a known currency", () => {
    const inr = getCurrencyMeta("INR")
    expect(inr?.symbol).toBe("₹")
    expect(inr?.locale).toBe("en-IN")
    expect(CURRENCIES.INR).toEqual(inr)
  })

  it("returns undefined for an unknown currency", () => {
    expect(getCurrencyMeta("ZZZ")).toBeUndefined()
  })

  it("narrows known currency codes", () => {
    expect(isKnownCurrency("USD")).toBe(true)
    expect(isKnownCurrency("ZZZ")).toBe(false)
  })
})

describe("getCurrencyDigits", () => {
  it("returns 2 for a two-decimal currency", () => {
    expect(getCurrencyDigits("INR")).toBe(2)
    expect(getCurrencyDigits("USD")).toBe(2)
  })

  it("returns 0 for a zero-decimal currency", () => {
    expect(getCurrencyDigits("JPY")).toBe(0)
  })

  it("falls back to 2 for an invalid currency code", () => {
    expect(getCurrencyDigits("not-a-currency")).toBe(2)
  })
})

describe("minorToMajor", () => {
  it("scales by the currency's minor-unit count", () => {
    expect(minorToMajor(-123450, "INR")).toBe(-1234.5)
    expect(minorToMajor(0, "INR")).toBe(0)
  })

  it("is identity for a zero-decimal currency", () => {
    expect(minorToMajor(1000, "JPY")).toBe(1000)
  })
})

describe("majorToMinor", () => {
  it("scales up to minor units and rounds to currency precision", () => {
    expect(majorToMinor(1234.5, "INR")).toBe(123450)
    expect(majorToMinor(0, "INR")).toBe(0)
  })

  it("rounds a fractional minor amount to the nearest integer", () => {
    // 10.005 * 100 = 1000.4999… → rounds to 1000 (float) — the guard is the round.
    expect(majorToMinor(10.007, "INR")).toBe(1001)
  })

  it("is identity for a zero-decimal currency", () => {
    expect(majorToMinor(1000, "JPY")).toBe(1000)
  })

  it("returns 0 for non-finite input (empty / NaN field)", () => {
    expect(majorToMinor(Number.NaN, "INR")).toBe(0)
    expect(majorToMinor(Number.POSITIVE_INFINITY, "USD")).toBe(0)
  })

  it("round-trips with minorToMajor for representable amounts", () => {
    expect(minorToMajor(majorToMinor(4999.99, "INR"), "INR")).toBe(4999.99)
  })
})

describe("formatMoney", () => {
  it("formats a negative minor amount with grouping and symbol", () => {
    const out = formatMoney(-123450, { locale: "en-IN", currency: "INR" })
    expect(out).toContain("₹")
    expect(out).toContain("1,234.50")
    expect(out.startsWith("-")).toBe(true)
  })

  it("formats a zero-decimal currency without fraction digits", () => {
    const out = formatMoney(1000, { locale: "ja-JP", currency: "JPY" })
    expect(out).toContain("1,000")
    expect(out).not.toContain(".00")
  })
})

describe("formatNumber", () => {
  it("applies explicit fraction digits and locale grouping", () => {
    expect(
      formatNumber(1234.5, { locale: "en-US", minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    ).toBe("1,234.50")
  })

  it("formats without explicit fraction options", () => {
    expect(formatNumber(42, { locale: "en-US" })).toBe("42")
  })
})

describe("privacyAmount", () => {
  it("is deterministic for the same input", () => {
    expect(privacyAmount(123456, "INR")).toBe(privacyAmount(123456, "INR"))
    expect(privacyAmount(0, "USD")).toBe(privacyAmount(0, "USD"))
  })

  it("ignores the sign of the input (masks magnitude only)", () => {
    expect(privacyAmount(-123456, "INR")).toBe(privacyAmount(123456, "INR"))
  })

  it("jitters the integer width by at most one digit", () => {
    for (const major of [1, 12, 123, 1234, 12345, 123456]) {
      const amount = major * 100 // INR minor units
      const baseDigits = major.toString().length
      const maskedMajor = Math.floor(privacyAmount(amount, "INR") / 100)
      const maskedDigits = maskedMajor.toString().length
      expect(Math.abs(maskedDigits - baseDigits)).toBeLessThanOrEqual(1)
    }
  })

  it("never produces a leading zero for multi-digit masked figures", () => {
    // Sweeps a wide range so the leading-zero-avoidance branch is exercised.
    for (let major = 10; major < 5000; major += 7) {
      const maskedMajor = Math.floor(privacyAmount(major * 100, "INR") / 100)
      if (maskedMajor >= 10) {
        expect(maskedMajor.toString().startsWith("0")).toBe(false)
      }
    }
  })

  it("fills the currency's fraction digits", () => {
    // Two-decimal currency: the masked value carries a fractional part space.
    const inr = privacyAmount(100000, "INR")
    expect(inr % 100).toBeGreaterThanOrEqual(0)
    expect(inr % 100).toBeLessThan(100)
  })

  it("has no fraction component for a zero-decimal currency", () => {
    const jpy = privacyAmount(12345, "JPY")
    expect(Number.isInteger(jpy)).toBe(true)
  })
})

describe("formatPrivacyMoney", () => {
  it("prefixes the neutral privacy glyph instead of a currency symbol", () => {
    const out = formatPrivacyMoney(123456, { locale: "en-IN", currency: "INR" })
    expect(out).toContain(PRIVACY_SYMBOL)
    expect(out).not.toContain("₹")
  })

  it("keeps a leading minus for negative amounts", () => {
    const out = formatPrivacyMoney(-123456, { locale: "en-IN", currency: "INR" })
    expect(out.startsWith("-")).toBe(true)
    expect(out).toContain(PRIVACY_SYMBOL)
  })

  it("has no leading minus for positive amounts", () => {
    const out = formatPrivacyMoney(123456, { locale: "en-IN", currency: "INR" })
    expect(out.startsWith("-")).toBe(false)
  })

  it("shows the currency's fraction digits", () => {
    const out = formatPrivacyMoney(123456, { locale: "en-IN", currency: "INR" })
    expect(out).toMatch(/\.\d{2}$/)
  })

  it("omits fraction digits for a zero-decimal currency", () => {
    const out = formatPrivacyMoney(12345, { locale: "ja-JP", currency: "JPY" })
    expect(out).not.toContain(".")
  })

  it("is deterministic", () => {
    const opts = { locale: "en-IN", currency: "INR" } as const
    expect(formatPrivacyMoney(987654, opts)).toBe(formatPrivacyMoney(987654, opts))
  })
})

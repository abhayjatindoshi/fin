import { describe, it, expect } from "vitest"
import { getAccountDisplay } from "@/catalog/account-display"
import { BANK_DISPLAY, KIND_DISPLAY } from "@/catalog/bank-display"

/**
 * `getAccountDisplay` is the single place the bank → offering → kind fallback
 * chain is applied. These tests pin each tier of that chain against the live
 * `BANK_DISPLAY` / `KIND_DISPLAY` catalog so every surface renders identically.
 */
describe("getAccountDisplay", () => {
  it("uses the bank brand label, offering sublabel, icon and color when both are known", () => {
    const bank = BANK_DISPLAY.hdfc

    const display = getAccountDisplay({
      name: "My HDFC",
      kind: "bank",
      bankId: "hdfc",
      offeringId: "savings",
    })

    expect(display).toEqual({
      icon: bank.icon,
      label: bank.label,
      sublabel: bank.offerings.savings.label,
      color: bank.color,
    })
  })

  it("falls back to the kind label when the bank is known but the offering is not", () => {
    const bank = BANK_DISPLAY.hdfc

    const display = getAccountDisplay({
      name: "My HDFC",
      kind: "bank",
      bankId: "hdfc",
      offeringId: "not-a-real-offering",
    })

    expect(display.label).toBe(bank.label)
    expect(display.sublabel).toBe(KIND_DISPLAY.bank.label)
    expect(display.color).toBe(bank.color)
  })

  it("falls back to the kind label when the bank is known but no offeringId is supplied", () => {
    const display = getAccountDisplay({
      name: "My HDFC",
      kind: "bank",
      bankId: "hdfc",
    })

    expect(display.sublabel).toBe(KIND_DISPLAY.bank.label)
  })

  it("falls back to the account name, kind icon and kind label when the bank is unknown", () => {
    const display = getAccountDisplay({
      name: "Some Account",
      kind: "credit-card",
      bankId: "not-a-real-bank",
      offeringId: "credit-card",
    })

    expect(display).toEqual({
      icon: KIND_DISPLAY["credit-card"].icon,
      label: "Some Account",
      sublabel: KIND_DISPLAY["credit-card"].label,
      color: undefined,
    })
  })

  it("uses the account name and kind display when there is no bankId at all", () => {
    const display = getAccountDisplay({
      name: "Wallet Cash",
      kind: "cash",
    })

    expect(display).toEqual({
      icon: KIND_DISPLAY.cash.icon,
      label: "Wallet Cash",
      sublabel: KIND_DISPLAY.cash.label,
      color: undefined,
    })
  })

  it("honours an explicit icon override ahead of the bank icon", () => {
    const bank = BANK_DISPLAY.hdfc

    const display = getAccountDisplay({
      name: "My HDFC",
      kind: "bank",
      bankId: "hdfc",
      offeringId: "savings",
      icon: "star",
    })

    expect(display.icon).toBe("star")
    // The rest of the chain still resolves from the bank.
    expect(display.label).toBe(bank.label)
    expect(display.color).toBe(bank.color)
  })
})

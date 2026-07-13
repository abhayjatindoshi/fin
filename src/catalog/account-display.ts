import type { AccountIconData } from "@/views/account-icon-data"
import { accountIconName } from "./icon-resolve"
import { getBankDisplay, getOfferingDisplay, getOfferingSlang, KIND_DISPLAY } from "./bank-display"

/** The structural subset an account display needs — satisfied by `AccountView`
 *  and the raw `Account` row alike, so every call site works without conversion. */
export type AccountDisplayInput = AccountIconData & {
  readonly name: string
  readonly bankId?: string
  readonly offeringId?: string
  /** Masked account number ("****1234") — used to detect the auto default name. */
  readonly maskedNumber?: string
}

/** Resolved, render-ready account display details. */
export type AccountDisplay = {
  /** Icon key via the unified fallback chain (override → bank → kind). */
  readonly icon: string
  /** Primary label — the user's custom name, or the bank brand when the name
   *  is still the auto-generated default (offering slang + masked number). */
  readonly label: string
  /** Secondary label — the offering/kind label; when a custom name is shown it
   *  is prefixed with the bank brand ("HDFC Bank · Savings Account") so the
   *  brand still appears, since the title no longer carries it. */
  readonly sublabel: string
  /** Bank brand color (hex), for tinting/badges; undefined when the bank is unknown. */
  readonly color?: string
}

/**
 * Resolve an account's display details from the shared catalog — the single
 * place the bank/offering/kind fallback chain is applied, so every surface
 * (accounts card, filter pill, cells) renders accounts identically. A custom
 * `name` always wins as the primary label; when it is still the auto default
 * (offering slang + masked number, e.g. "HDFC ****1234") the bank brand shows
 * instead, since that isn't a real user choice.
 */
export function getAccountDisplay(account: AccountDisplayInput): AccountDisplay {
  const bank = account.bankId ? getBankDisplay(account.bankId) : undefined
  const offering =
    account.bankId && account.offeringId
      ? getOfferingDisplay(account.bankId, account.offeringId)
      : undefined

  // Reconstruct the auto default name (slang + masked number) to tell a real
  // custom name from the imported placeholder.
  const slang =
    account.bankId && account.offeringId
      ? getOfferingSlang(account.bankId, account.offeringId)
      : undefined
  const defaultName = slang
    ? account.maskedNumber
      ? `${slang} ${account.maskedNumber}`
      : slang
    : undefined
  const usesDefaultName = defaultName !== undefined && account.name === defaultName

  const product = offering?.label ?? KIND_DISPLAY[account.kind].label
  return {
    icon: accountIconName(account),
    label: usesDefaultName ? (bank?.label ?? account.name) : account.name,
    // The default-name title already carries the brand, so its sublabel is just
    // the product. A custom-name title doesn't, so prefix the brand back in.
    sublabel: usesDefaultName || !bank ? product : `${bank.label} · ${product}`,
    color: bank?.color,
  }
}

import type { AccountIconData } from "@/views/account-icon-data"
import { accountIconName } from "./icon-resolve"
import { getBankDisplay, getOfferingDisplay, KIND_DISPLAY } from "./bank-display"

/** The structural subset an account display needs — satisfied by `AccountView`
 *  and the raw `Account` row alike, so every call site works without conversion. */
export type AccountDisplayInput = AccountIconData & {
  readonly name: string
  readonly bankId?: string
  readonly offeringId?: string
}

/** Resolved, render-ready account display details. */
export type AccountDisplay = {
  /** Icon key via the unified fallback chain (override → bank → kind). */
  readonly icon: string
  /** Primary label — the bank's brand name when known, else the account name. */
  readonly label: string
  /** Secondary label — the offering label when known, else the kind label. */
  readonly sublabel: string
  /** Bank brand color (hex), for tinting/badges; undefined when the bank is unknown. */
  readonly color?: string
}

/**
 * Resolve an account's display details from the shared catalog — the single
 * place the bank/offering/kind fallback chain is applied, so every surface
 * (accounts card, filter pill, cells) renders accounts identically.
 */
export function getAccountDisplay(account: AccountDisplayInput): AccountDisplay {
  const bank = account.bankId ? getBankDisplay(account.bankId) : undefined
  const offering =
    account.bankId && account.offeringId
      ? getOfferingDisplay(account.bankId, account.offeringId)
      : undefined
  return {
    icon: accountIconName(account),
    label: bank?.label ?? account.name,
    sublabel: offering?.label ?? KIND_DISPLAY[account.kind].label,
    color: bank?.color,
  }
}

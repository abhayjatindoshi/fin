import { Icon } from "@/ui/icon"
import { useObservable } from "@/providers/use-observable"
import { useServices } from "@/providers/services-provider"
import { useApp } from "@/providers/app-provider"
import {
  formatMoney,
  formatNumber,
  formatPrivacyMoney,
  getCurrencyDigits,
  minorToMajor,
  privacyAmount,
  PRIVACY_SYMBOL,
} from "@/lib/format"
import { Currency } from "@/components/currency"
import { cn } from "@/lib/utils"

export type MoneyVariant = "default" | "icon"

export type MoneyProps = {
  readonly amount: number
  /** Override the user's default currency. Falls back to the active user's `settings.currency`. */
  readonly currency?: string
  /** Override the user's default locale. Falls back to the active user's `settings.locale`. */
  readonly locale?: string
  /**
   * - `default` (recommended) — single locale-aware string from `Intl.NumberFormat({ style: 'currency' })`
   * - `icon` — old-app layout: separate sign icon + currency icon + plain number
   */
  readonly variant?: MoneyVariant
  /** Show a leading +/- icon (only honoured by `variant="icon"`). */
  readonly sign?: boolean
  readonly className?: string
}

/**
 * Renders a money amount, locale- and currency-aware. The currency and locale
 * default to the active user's settings, and can be overridden per-call (used
 * for foreign-currency display once per-account currencies land).
 */
export function Money({
  amount,
  currency,
  locale,
  variant = "default",
  sign = true,
  className,
}: MoneyProps) {
  const settings = useObservable(useServices().settings.settings$)
  const { privacyMode } = useApp()
  const code = currency ?? settings.currency
  const loc = locale ?? settings.locale

  if (variant === "default") {
    const text = privacyMode
      ? formatPrivacyMoney(amount, { locale: loc, currency: code })
      : formatMoney(amount, { locale: loc, currency: code })
    return <span className={className}>{text}</span>
  }

  // variant === "icon" — old-app split layout. Decimals are shown only when
  // present (whole amounts render without a trailing ".00").
  const digits = getCurrencyDigits(code)
  const displayAmount = privacyMode ? privacyAmount(amount, code) : Math.abs(amount)
  const number = formatNumber(minorToMajor(displayAmount, code), {
    locale: loc,
    minimumFractionDigits: privacyMode ? digits : 0,
    maximumFractionDigits: digits,
  })

  return (
    <span className={cn("inline-flex flex-row items-center", className)}>
      {sign && <Icon name={amount < 0 ? "minus" : "plus"} className="size-3 text-muted-foreground" aria-hidden />}
      {privacyMode
        ? <span className="px-0.5" aria-hidden>{PRIVACY_SYMBOL}</span>
        : <Currency code={code} variant="icon" className="size-3" aria-hidden />}
      <span className="truncate">{number}</span>
    </span>
  )
}

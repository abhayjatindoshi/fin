/**
 * Locale-aware formatting helpers for money and numbers.
 *
 * All amounts are stored as major units (e.g. `1234.5` = ₹1,234.50). Decimal
 * precision per currency is taken from the runtime via `Intl.NumberFormat`.
 */

export type CurrencyCode =
  | "INR" | "USD" | "EUR" | "GBP" | "JPY"
  | "GEL" | "PHP" | "RUB" | "SAR" | "CHF" | "TRY"

export type CurrencyMeta = {
  readonly code: CurrencyCode
  readonly name: string
  readonly symbol: string
  readonly locale: string
  /** Key into the icon system — see `currency-icons` pack in `icons.config.ts`. */
  readonly iconName: string
}

const CURRENCIES_LIST: readonly CurrencyMeta[] = [
  { code: "INR", name: "Indian Rupee",     symbol: "₹", locale: "en-IN", iconName: "indian-rupee"    },
  { code: "USD", name: "US Dollar",        symbol: "$", locale: "en-US", iconName: "dollar-sign"     },
  { code: "EUR", name: "Euro",             symbol: "€", locale: "de-DE", iconName: "euro"            },
  { code: "GBP", name: "British Pound",    symbol: "£", locale: "en-GB", iconName: "pound-sterling"  },
  { code: "JPY", name: "Japanese Yen",     symbol: "¥", locale: "ja-JP", iconName: "japanese-yen"    },
  { code: "GEL", name: "Georgian Lari",    symbol: "₾", locale: "ka-GE", iconName: "georgian-lari"   },
  { code: "PHP", name: "Philippine Peso",  symbol: "₱", locale: "en-PH", iconName: "philippine-peso" },
  { code: "RUB", name: "Russian Ruble",    symbol: "₽", locale: "ru-RU", iconName: "russian-ruble"   },
  { code: "SAR", name: "Saudi Riyal",      symbol: "﷼", locale: "ar-SA", iconName: "saudi-riyal"     },
  { code: "CHF", name: "Swiss Franc",      symbol: "₣", locale: "de-CH", iconName: "swiss-franc"     },
  { code: "TRY", name: "Turkish Lira",     symbol: "₺", locale: "tr-TR", iconName: "turkish-lira"    },
]

export const CURRENCIES: Readonly<Partial<Record<CurrencyCode, CurrencyMeta>>> =
  Object.fromEntries(CURRENCIES_LIST.map((c) => [c.code, c]))

export function getCurrencyMeta(code: string): CurrencyMeta | undefined {
  return CURRENCIES[code as CurrencyCode]
}

export function isKnownCurrency(code: string): code is CurrencyCode {
  return code in CURRENCIES
}

/**
 * Converts an integer minor-unit amount to major units for display.
 * Example: `minorToMajor(-123450, 'INR')` → `-1234.5`.
 */
export function minorToMajor(minor: number, currency: string): number {
  return minor / 10 ** getCurrencyDigits(currency)
}

/**
 * Converts a major-unit amount (as a user types it) to integer minor units for
 * storage, rounding to the currency's precision. Example:
 * `majorToMinor(1234.5, 'INR')` → `123450`. Non-finite input yields `0`.
 */
export function majorToMinor(major: number, currency: string): number {
  if (!Number.isFinite(major)) return 0
  return Math.round(major * 10 ** getCurrencyDigits(currency))
}

/**
 * Formats a minor-unit `amount` as a complete currency string using
 * `Intl.NumberFormat`.
 * Example: `formatMoney(-123450, { locale: 'en-IN', currency: 'INR' })` → `"-₹1,234.50"`.
 */
export function formatMoney(
  amount: number,
  opts: { readonly locale: string; readonly currency: string },
): string {
  return new Intl.NumberFormat(opts.locale, {
    style: "currency",
    currency: opts.currency,
  }).format(minorToMajor(amount, opts.currency))
}

/**
 * Formats `amount` as a locale-aware number string with explicit decimals.
 * Used for the icon-style `<Money>` variant where the currency icon is
 * rendered separately.
 */
export function formatNumber(
  value: number,
  opts: {
    readonly locale: string
    readonly minimumFractionDigits?: number
    readonly maximumFractionDigits?: number
  },
): string {
  return new Intl.NumberFormat(opts.locale, {
    minimumFractionDigits: opts.minimumFractionDigits,
    maximumFractionDigits: opts.maximumFractionDigits,
  }).format(value)
}

/**
 * Returns the standard minor-unit count for a currency.
 * (JPY = 0, most others = 2.)
 */
export function getCurrencyDigits(code: string): number {
  // Use Intl to introspect — handles every ISO 4217 code, falls back to 2.
  try {
    const parts = new Intl.NumberFormat("en", { style: "currency", currency: code }).formatToParts(0)
    const fraction = parts.find((p) => p.type === "fraction")
    return fraction ? fraction.value.length : 0
  } catch {
    return 2
  }
}

/** Neutral, non-currency glyph shown in place of the currency symbol while privacy mode hides amounts. */
export const PRIVACY_SYMBOL = "#"

/** FNV-1a-style 32-bit hash used to deterministically scramble an amount. */
function hashAmount(n: number): number {
  let h = (2166136261 ^ (n | 0)) >>> 0
  h = Math.imul(h, 16777619)
  h ^= h >>> 15
  h = Math.imul(h, 16777619)
  h ^= h >>> 13
  return h >>> 0
}

/**
 * Deterministic obfuscated minor-unit amount for privacy mode. The masked
 * integer width is derived from the amount's magnitude but deliberately jittered
 * (±1 digit) so it does not exactly reveal the original digit count; the digits
 * themselves are pseudo-random and unrecoverable. Stable per input (same amount
 * → same mask) to avoid flicker across re-renders.
 */
export function privacyAmount(amount: number, currency: string): number {
  const digits = getCurrencyDigits(currency)
  const scale = 10 ** digits
  const majorAbs = Math.floor(Math.abs(amount) / scale)
  const baseDigits = Math.max(1, majorAbs.toString().length)
  let h = hashAmount(Math.round(Math.abs(amount)))

  // Jitter the integer width by -1/0/+1 so masked figures no longer map 1:1 to
  // the real digit count. Keep at least one integer digit.
  const jitter = (h % 3) - 1
  const intDigits = Math.max(1, baseDigits + jitter)

  let intPart = 0
  for (let i = 0; i < intDigits; i++) {
    h = hashAmount(h + i * 31 + 7)
    let d = h % 10
    if (i === 0 && intDigits > 1 && d === 0) d = 1 + (h % 9)
    intPart = intPart * 10 + d
  }

  let frac = 0
  for (let i = 0; i < digits; i++) {
    h = hashAmount(h + i * 17 + 101)
    frac = frac * 10 + (h % 10)
  }

  return intPart * scale + frac
}

/**
 * Formats `amount` for privacy mode: a pseudo-random figure of a similar width,
 * prefixed with {@link PRIVACY_SYMBOL} instead of the currency glyph. Negative
 * amounts keep their leading sign so income/expense colouring stays consistent.
 */
export function formatPrivacyMoney(
  amount: number,
  opts: { readonly locale: string; readonly currency: string },
): string {
  const digits = getCurrencyDigits(opts.currency)
  const fake = privacyAmount(amount, opts.currency)
  const number = formatNumber(minorToMajor(fake, opts.currency), {
    locale: opts.locale,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
  return `${amount < 0 ? "-" : ""}${PRIVACY_SYMBOL}${number}`
}

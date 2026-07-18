import { Icon } from "@/ui/icon"
import { accountIconName } from "@/catalog/icon-resolve"
import { getBankDisplay, getOfferingDisplay, getOfferingSlang, KIND_DISPLAY } from "@/catalog/bank-display"
import { cn } from "@/lib/utils"
import type { AccountView } from "@/views/account-view"
import type { AccountMarkerVariant } from "./account-marker-variants"

export type AccountMarkerProps = {
  readonly account: AccountView
  readonly variant?: AccountMarkerVariant
  /** For `layered`/`avatar`: append the last-4 beside the icon (desktop). */
  readonly showNumber?: boolean
  readonly className?: string
}

/** Last 4 digits of a masked number ("****1234" → "1234"), or undefined. */
function last4Of(masked?: string): string | undefined {
  const digits = masked?.replace(/\D/g, "")
  return digits ? digits.slice(-4) : undefined
}

/**
 * Trial renderings of a transaction row's account marker. `current` reproduces
 * today's `icon + ****1234`; the rest explore denser / richer treatments so
 * they can be compared live inside the row variants. Presentational: takes an
 * already-resolved account view.
 */
export function AccountMarker({ account, variant = "current", showNumber, className }: AccountMarkerProps) {
  const iconName = accountIconName(account)
  const last4 = last4Of(account.maskedNumber)

  if (variant === "icon") {
    return <Icon name={iconName} className={cn("size-5 text-muted-foreground", className)} />
  }

  if (variant === "last4") {
    return (
      <div className={cn("flex flex-row items-center gap-1.5", className)}>
        <Icon name={iconName} className="size-5 text-muted-foreground" />
        {last4 && <span className="text-sm font-light text-muted-foreground tabular-nums">·{last4}</span>}
      </div>
    )
  }

  if (variant === "pill") {
    return (
      <div
        className={cn(
          "inline-flex flex-row items-center gap-1.5 rounded-full bg-muted px-2 py-0.5",
          className,
        )}
      >
        <Icon name={iconName} className="size-4 text-muted-foreground" />
        {last4 && <span className="text-xs font-light text-muted-foreground tabular-nums">{last4}</span>}
      </div>
    )
  }

  if (variant === "avatar") {
    const color = account.bankId ? getBankDisplay(account.bankId)?.color : undefined
    return (
      <span
        className={cn("flex size-7 items-center justify-center rounded-full", !color && "bg-muted", className)}
        style={color ? { backgroundColor: `${color}22`, color } : undefined}
        title={account.maskedNumber}
      >
        <Icon name={iconName} className={cn("size-4", !color && "text-muted-foreground")} />
      </span>
    )
  }

  if (variant === "slang") {
    const slang =
      account.bankId && account.offeringId
        ? getOfferingSlang(account.bankId, account.offeringId)
        : undefined
    return (
      <div className={cn("flex flex-row items-center gap-1.5", className)}>
        <Icon name={iconName} className="size-5 text-muted-foreground" />
        <span className="truncate text-sm font-light text-muted-foreground">{slang ?? account.name}</span>
      </div>
    )
  }

  if (variant === "layered") {
    const offeringIcon =
      (account.bankId && account.offeringId
        ? getOfferingDisplay(account.bankId, account.offeringId)?.icon
        : undefined) ?? KIND_DISPLAY[account.kind].icon
    const bankIcon = account.bankId ? getBankDisplay(account.bankId)?.icon : undefined
    const withNumber = showNumber && last4
    return (
      <div
        className={cn(
          "inline-flex h-7 flex-row items-center gap-1.5 rounded-full bg-muted p-0.5",
          withNumber && "pr-2.5",
          className,
        )}
        title={account.maskedNumber}
      >
        <div className="relative size-6 shrink-0">
          <span className="flex size-6 items-center justify-center rounded-full bg-background">
            <Icon name={offeringIcon} className="size-3.5 text-muted-foreground" />
          </span>
          {bankIcon && (
            <span className="absolute -bottom-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full bg-background">
              <Icon name={bankIcon} className="size-2.5" />
            </span>
          )}
        </div>
        {withNumber && (
          <span className="text-sm font-light text-muted-foreground tabular-nums">·{last4}</span>
        )}
      </div>
    )
  }

  // "current" — today's icon + full masked number.
  return (
    <div className={cn("flex flex-row items-center gap-2", className)}>
      <Icon name={iconName} className="size-5 text-muted-foreground" />
      {account.maskedNumber && (
        <span className="text-sm font-light text-muted-foreground">{account.maskedNumber}</span>
      )}
    </div>
  )
}

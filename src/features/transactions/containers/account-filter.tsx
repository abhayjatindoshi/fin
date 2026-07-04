import { Button } from "@/ui/button"
import { Icon } from "@/ui/icon"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/dropdown-menu"
import { getAccountDisplay } from "@/catalog/account-display"
import { cn } from "@/lib/utils"
import { useObservable } from "@/providers/use-observable"
import { useServices } from "@/providers/services-provider"
import type { FilterControlProps } from "../types"

/** Multi-select account filter. Empty selection = all accounts. */
export function AccountFilter({ state, variant = "bar", className }: FilterControlProps) {
  const { filter, patch } = state
  const selected = filter.accountIds
  const accounts = useObservable(useServices().accounts.accounts$)

  const toggle = (id: string) => {
    patch({ accountIds: selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id] })
  }

  const onlyAccount = selected.length === 1 ? accounts.find((a) => a.id === selected[0]) : undefined
  const label =
    selected.length === 0
      ? "All accounts"
      : onlyAccount
        ? getAccountDisplay(onlyAccount).label
        : `${selected.length} accounts`

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "glass h-9 rounded-full border border-border font-light",
            variant === "sheet" && "w-full justify-start",
            className,
          )}
        >
          <Icon name={onlyAccount ? getAccountDisplay(onlyAccount).icon : "landmark"} />
          <span className="truncate">{label}</span>
          <Icon name="chevron-down" className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-80 w-72 overflow-auto">
        <DropdownMenuItem onClick={() => { patch({ accountIds: [] }) }}>
          <Icon name="landmark" className="size-4 text-muted-foreground" />
          All accounts
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {accounts.map((account) => {
          const display = getAccountDisplay(account)
          const masked = account.maskedNumber
          const isSelected = selected.includes(account.id)
          return (
            <DropdownMenuItem
              key={account.id}
              role="menuitemcheckbox"
              aria-checked={isSelected}
              onSelect={(e) => { e.preventDefault(); toggle(account.id) }}
              className={cn("gap-2.5 py-1.5", isSelected && "bg-primary/10")}
            >
              <Icon
                name={display.icon}
                className={cn("size-5", isSelected ? "text-primary" : "text-muted-foreground")}
              />
              <span className="flex min-w-0 flex-col">
                <span className={cn("truncate", isSelected && "font-medium")}>{display.label}</span>
                <span className="truncate text-xs text-muted-foreground">{display.sublabel}</span>
              </span>
              {masked && (
                <span className="ml-auto shrink-0 font-mono text-sm font-medium tracking-wide tabular-nums">
                  {masked}
                </span>
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

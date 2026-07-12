import { NavLink, useParams, useLocation } from "react-router"
import { Icon } from "@/ui/icon"
import { PillBar } from "@/ui/pill-bar"
import { AccountSheet } from "@/features/shell/account-sheet"
import { NotificationsSheet } from "@/features/shell/notifications-sheet"

type NavItem = {
  readonly key: string
  readonly label: string
  readonly path: string
  readonly iconName: string
}

const NAV: readonly NavItem[] = [
  { key: "home", label: "Home", path: "", iconName: "home" },
  { key: "accounts", label: "Accounts", path: "accounts", iconName: "wallet" },
  { key: "tag", label: "Tag", path: "tag", iconName: "tags" },
  { key: "transactions", label: "Transactions", path: "transactions", iconName: "arrow-left-right" },
]

type NavMenuProps = {
  /** `labels` = desktop pill row; `icons` = mobile bottom bar (icon-only). */
  readonly variant: "labels" | "icons"
}

/**
 * Primary navigation as a single `PillBar`. Desktop renders a labelled pill
 * row. Mobile renders the icon-only bottom bar and folds the notifications bell
 * and the account pill in as bar items (no separate pills). The shell places
 * this component; on mobile it's the only thing in the bottom line.
 */
export function NavMenu({ variant }: NavMenuProps) {
  const { tenantId } = useParams()
  const location = useLocation()
  if (!tenantId) return null

  const base = `/t/${tenantId}`
  const icons = variant === "icons"

  const navItems = NAV.map((item) => {
    const to = item.path ? `${base}/${item.path}` : base
    const active = item.path
      ? location.pathname.startsWith(`${base}/${item.path}`)
      : location.pathname === base
    return {
      key: item.key,
      active,
      element: (
        <NavLink to={to} end={!item.path} aria-label={item.label} className="relative z-10 flex items-center gap-1.5">
          <Icon name={item.iconName} className="size-4" />
          {!icons && <span>{item.label}</span>}
        </NavLink>
      ),
    }
  })

  if (!icons) {
    return <PillBar items={navItems} surface="glass" />
  }

  const items = [
    ...navItems,
    { key: "notifications", active: false, element: <NotificationsSheet bare /> },
    { key: "account", active: false, element: <AccountSheet bare /> },
  ]

  return <PillBar items={items} surface="glass" />
}

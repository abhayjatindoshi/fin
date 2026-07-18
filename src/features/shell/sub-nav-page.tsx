import { NavLink } from "react-router"
import { Icon } from "@/ui/icon"
import type { SubNav } from "./app-shell-provider"

export type SubNavPageProps = {
  readonly subNav: SubNav
}

/**
 * Mobile drill-in menu — a full-page list of the section's items. Tapping a row
 * opens that sub-section. Rendered by a page at its sub-nav base path when the
 * viewport is mobile; the shell shows a back affordance once inside a section.
 */
export function SubNavPage({ subNav }: SubNavPageProps) {
  return (
    <div className="flex w-full flex-col gap-2 px-2">
      {subNav.items.map((item) => (
        <NavLink
          key={item.key}
          to={`${subNav.basePath}/${item.key}`}
          className="glass flex items-center gap-3 rounded-xl border border-border px-4 py-3.5 text-sm transition-colors hover:bg-muted"
        >
          <Icon name={item.icon} className="size-5 text-muted-foreground" />
          <span className="flex-1 font-medium">{item.label}</span>
          <Icon name="chevron-right" className="size-4 text-muted-foreground" />
        </NavLink>
      ))}
    </div>
  )
}

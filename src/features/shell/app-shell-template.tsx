import { useCallback, type CSSProperties } from "react"
import { NavLink, Outlet, useLocation, useNavigate } from "react-router"
import { cn } from "@/lib/utils"
import { Icon } from "@/ui/icon"
import { PillBar } from "@/ui/pill-bar"
import { useApp } from "@/providers/app-provider"
import { Dropzone } from "@/components/import/dropzone"
import { ImportSurface } from "@/features/import/import-surface"
import { BrandPill } from "@/features/shell/brand-pill"
import { YearPill } from "@/features/shell/year-pill"
import { NavMenu } from "@/features/shell/nav-menu"
import { AccountSheet } from "@/features/shell/account-sheet"
import { NotificationsSheet } from "@/features/shell/notifications-sheet"
import { useShell, type SubNav } from "./app-shell-provider"

/** The sub-menu bar — a `PillBar` of the registered sub-nav items. */
function SubNavBar({ subNav }: { readonly subNav: SubNav }) {
  const { pathname } = useLocation()
  const activeKey = pathname.startsWith(subNav.basePath)
    ? pathname.slice(subNav.basePath.length).split("/").filter(Boolean)[0] ?? ""
    : ""

  const items = subNav.items.map((item) => ({
    key: item.key,
    active: item.key === activeKey,
    element: (
      <NavLink
        to={`${subNav.basePath}/${item.key}`}
        className="relative z-10 flex items-center gap-1.5"
      >
        <Icon name={item.icon} className="size-4" />
        {item.label}
      </NavLink>
    ),
  }))

  return (
    <PillBar items={items} className="glass h-10 w-fit max-w-full rounded-full px-1.5" />
  )
}

/**
 * The mobile sub-menu chrome. At the section base it shows the section title;
 * inside a section it becomes a back bar (tap returns to the drill-in menu).
 */
function MobileSubNav({ subNav }: { readonly subNav: SubNav }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const activeKey = pathname.startsWith(subNav.basePath)
    ? pathname.slice(subNav.basePath.length).split("/").filter(Boolean)[0] ?? ""
    : ""
  const active = subNav.items.find((item) => item.key === activeKey)

  return (
    <div className="flex h-10 items-center gap-1">
      {active ? (
        <>
          <button
            type="button"
            aria-label="Back to menu"
            onClick={() => { void navigate(subNav.basePath) }}
            className="-ml-1 flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Icon name="chevron-left" className="size-5" />
          </button>
          <span className="text-lg font-semibold">{active.label}</span>
        </>
      ) : (
        <span className="text-lg font-semibold">{subNav.title}</span>
      )}
    </div>
  )
}

/**
 * The full desktop + mobile layout, consumed by `AppShellProvider`. Places the
 * nav, slots (collapsing when unset), year, and sheets; renders the routed page
 * and the global overlays. Reads offsets/slots/sub-nav from shell context.
 */
export function AppShellTemplate() {
  const { isMobile } = useApp()
  const { subNav, setNode, filled, chromeTop, chromeBottom } = useShell()

  const setPrimary = useCallback((el: HTMLElement | null) => { setNode("primary", el) }, [setNode])
  const setSecondary = useCallback((el: HTMLElement | null) => { setNode("secondary", el) }, [setNode])

  const contentStyle = {
    paddingTop: chromeTop,
    paddingBottom: chromeBottom,
    "--chrome-top": `${String(chromeTop)}px`,
  } as CSSProperties

  if (isMobile) {
    return (
      <div className="w-full">
        <div className="absolute inset-x-0 top-4 z-20 flex flex-col gap-2 px-2">
          {subNav && <MobileSubNav subNav={subNav} />}
          <div
            ref={setPrimary}
            className={cn("flex min-w-0 items-center gap-2", !filled.primary && "hidden")}
          />
          <div
            ref={setSecondary}
            className={cn(!filled.secondary && "hidden")}
          />
        </div>

        <div style={contentStyle}>
          <Outlet />
        </div>

        <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center px-2">
          <NavMenu variant="icons" />
        </div>

        <Dropzone />
        <ImportSurface />
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="absolute inset-x-0 top-4 z-20 mx-20 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <BrandPill />
          <NavMenu variant="labels" />
          <div
            ref={setPrimary}
            className="flex min-w-0 flex-1 items-center gap-2"
          />
          <YearPill />
          <NotificationsSheet />
          <AccountSheet />
        </div>
        {subNav && <SubNavBar subNav={subNav} />}
        <div
          ref={setSecondary}
          className={cn(!filled.secondary && "hidden")}
        />
      </div>

      <div style={contentStyle} className="mx-24">
        <Outlet />
      </div>

      <Dropzone />
      <ImportSurface />
    </div>
  )
}

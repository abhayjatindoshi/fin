import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { createPortal } from "react-dom"
import { useLocation } from "react-router"
import { useApp } from "@/providers/app-provider"
import { AppShellTemplate } from "./app-shell-template"

// ─── Types ────────────────────────────────────────────────

export type SubNavItem = {
  readonly key: string
  readonly label: string
  readonly icon: string
}

/** A page's secondary navigation. `basePath` is the full route base (e.g. `/t/x/settings`). */
export type SubNav = {
  readonly title: string
  readonly basePath: string
  readonly items: readonly SubNavItem[]
}

type SlotName = "primary" | "secondary"

type ShellContextValue = {
  readonly subNav: SubNav | null
  readonly setSubNav: (s: SubNav | null) => void
  readonly nodes: Readonly<Record<SlotName, HTMLElement | null>>
  readonly setNode: (name: SlotName, el: HTMLElement | null) => void
  readonly filled: Readonly<Record<SlotName, boolean>>
  readonly setFilled: (name: SlotName, filled: boolean) => void
  /** Computed chrome offsets (px) — content padding + sticky offsets read these. */
  readonly chromeTop: number
  readonly chromeBottom: number
}

const ShellContext = createContext<ShellContextValue | undefined>(undefined)

function useShell(): ShellContextValue {
  const ctx = useContext(ShellContext)
  if (!ctx) throw new Error("useShell must be used within an AppShellProvider")
  return ctx
}

// ─── Offset computation (provider's job) ──────────────────

const DESKTOP_BASE = 72 // line-1 bar + top margin
const LINE = 48 // each extra desktop line (sub-nav / secondary)
const MOBILE_ROW = 48 // each mobile top row (primary / secondary)
const MOBILE_TOP_BASE = 16
const MOBILE_BOTTOM = 72 // bottom nav + margin

function computeOffsets(
  isMobile: boolean,
  hasSubNav: boolean,
  filled: Record<SlotName, boolean>,
): { top: number; bottom: number } {
  if (isMobile) {
    const rows =
      (filled.primary ? 1 : 0) + (filled.secondary ? 1 : 0) + (hasSubNav ? 1 : 0)
    return { top: MOBILE_TOP_BASE + rows * MOBILE_ROW, bottom: MOBILE_BOTTOM }
  }
  const top = DESKTOP_BASE + (hasSubNav ? LINE : 0) + (filled.secondary ? LINE : 0)
  return { top, bottom: 16 }
}

// ─── Provider ─────────────────────────────────────────────

export function AppShellProvider() {
  const { isMobile } = useApp()
  const [subNav, setSubNav] = useState<SubNav | null>(null)
  const [nodes, setNodes] = useState<Record<SlotName, HTMLElement | null>>({
    primary: null,
    secondary: null,
  })
  const [filled, setFilledState] = useState<Record<SlotName, boolean>>({
    primary: false,
    secondary: false,
  })

  const setNode = useCallback(
    (name: SlotName, el: HTMLElement | null) => {
      setNodes((p) => (p[name] === el ? p : { ...p, [name]: el }))
    },
    [],
  )
  const setFilled = useCallback(
    (name: SlotName, f: boolean) => {
      setFilledState((p) => (p[name] === f ? p : { ...p, [name]: f }))
    },
    [],
  )

  const { top, bottom } = computeOffsets(isMobile, subNav !== null, filled)

  const value = useMemo<ShellContextValue>(
    () => ({ subNav, setSubNav, nodes, setNode, filled, setFilled, chromeTop: top, chromeBottom: bottom }),
    [subNav, setSubNav, nodes, setNode, filled, setFilled, top, bottom],
  )

  return (
    <ShellContext.Provider value={value}>
      <AppShellTemplate />
    </ShellContext.Provider>
  )
}

// ─── Page-facing API ──────────────────────────────────────

/**
 * Register a page's sub-navigation with the shell (rendered as a desktop line-2
 * bar or a mobile drill-in page). Returns the active section key derived from
 * the route. Pages render their own section body from `activeKey`.
 */
export function useAppShell(options?: { readonly subNav?: SubNav }): { activeKey: string } {
  const ctx = useContext(ShellContext)
  const setSubNav = ctx?.setSubNav
  const location = useLocation()
  const sub = options?.subNav ?? null

  // Re-register only when the signature changes (title / base / item keys), not
  // on every render — pages pass a fresh `subNav` object each time.
  const signature = sub ? `${sub.title}|${sub.basePath}|${sub.items.map((i) => i.key).join(",")}` : ""
  // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed intentionally by signature
  const registered = useMemo(() => sub, [signature])

  useEffect(() => {
    if (!setSubNav) return
    setSubNav(registered)
    return () => { setSubNav(null) }
  }, [registered, setSubNav])

  const activeKey = useMemo(() => {
    if (!sub) return ""
    if (!location.pathname.startsWith(sub.basePath)) return ""
    return location.pathname.slice(sub.basePath.length).split("/").filter(Boolean)[0] ?? ""
  }, [sub, location.pathname])

  return { activeKey }
}

/**
 * The shell's computed chrome offsets (px) — the top/bottom padding that clears
 * the floating nav/sub-nav. Pages use it for sticky offsets instead of
 * hard-coded numbers, so they stay correct as the chrome grows.
 */
export function useChromeOffsets(): { readonly top: number; readonly bottom: number } {
  const { chromeTop, chromeBottom } = useShell()
  return { top: chromeTop, bottom: chromeBottom }
}

/** Portal a page's chrome (search/filters) into the shell's primary slot. */
export function PrimarySlot({ children }: { readonly children: ReactNode }) {
  return <SlotPortal name="primary">{children}</SlotPortal>
}

/** Portal a page's chrome into the shell's full-width secondary slot. */
export function SecondarySlot({ children }: { readonly children: ReactNode }) {
  return <SlotPortal name="secondary">{children}</SlotPortal>
}

function SlotPortal({ name, children }: { readonly name: SlotName; readonly children: ReactNode }) {
  const { nodes, setFilled } = useShell()
  const node = nodes[name]
  useEffect(() => {
    setFilled(name, true)
    return () => { setFilled(name, false) }
  }, [name, setFilled])
  return node ? createPortal(children, node) : null
}

// Internal — for the template only.
export { useShell }

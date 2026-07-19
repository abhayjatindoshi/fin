import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react"
import { FyreDbConfigError, type FyreDb } from '@fyre-db/core'
import { useDb } from "@fyre-db/plugins-ui"
import { registerMagicWord } from "@/lib/magic-word"

const MOBILE_BREAKPOINT = 768
const DEV_MODE_WORD = "PAIDEVMODE"
const PRIVACY_MODE_KEY = "pai:privacyMode"

/** Debug handle exposed on `window.pai` while dev mode is on. */
declare global {
  interface Window {
    pai?: { readonly fyredb: FyreDb | null }
  }
}

type AppContextValue = {
  readonly isMobile: boolean
  readonly scrollElementRef: RefObject<HTMLDivElement | null>
  /** Whether developer tools are enabled. Toggled by typing `PAIDEVMODE`. */
  readonly devMode: boolean
  readonly setDevMode: (on: boolean) => void
  /** Whether privacy mode is on — hides real amounts behind randomised, symbol-masked figures. */
  readonly privacyMode: boolean
  readonly setPrivacyMode: (on: boolean) => void
}

const AppContext = createContext<AppContextValue | undefined>(undefined)

type AppProviderProps = {
  readonly children: ReactNode
  readonly scrollElementRef?: RefObject<HTMLDivElement | null>
}

export function AppProvider({ children, scrollElementRef: externalRef }: AppProviderProps) {
  const internalRef = useRef<HTMLDivElement | null>(null)
  const scrollElementRef = externalRef ?? internalRef
  const fyredb = useDb()

  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT,
  )

  // Default-on for `npm run dev`, off in production. Runtime-only — resets
  // on reload. Typing `PAIDEVMODE` toggles it on any page.
  const [devMode, setDevMode] = useState<boolean>(import.meta.env.DEV)

  // Per-device privacy toggle. Persisted to localStorage so hidden amounts stay
  // hidden across reloads; never synced (it is a local viewing preference).
  const [privacyMode, setPrivacyMode] = useState<boolean>(
    () => typeof window !== "undefined" && window.localStorage.getItem(PRIVACY_MODE_KEY) === "1",
  )

  useEffect(() => {
    if (typeof window === "undefined") return
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const handler = (e: MediaQueryListEvent) => { setIsMobile(e.matches); }
    mql.addEventListener("change", handler)
    return () => { mql.removeEventListener("change", handler); }
  }, [])

  useEffect(() => {
    return registerMagicWord(DEV_MODE_WORD, () => { setDevMode((on) => !on); })
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(PRIVACY_MODE_KEY, privacyMode ? "1" : "0")
  }, [privacyMode])

  // Expose a `window.pai` debug handle (holding the active FyreDb instance)
  // while dev mode is on. Removed when dev mode is off or on unmount.
  useEffect(() => {
    if (!devMode) return
    window.pai = { fyredb }
    return () => { delete window.pai }
  }, [devMode, fyredb])

  const value = useMemo<AppContextValue>(
    () => ({ isMobile, scrollElementRef, devMode, setDevMode, privacyMode, setPrivacyMode }),
    [isMobile, scrollElementRef, devMode, privacyMode],
  )

  return (
    <AppContext.Provider value={value}>{children}</AppContext.Provider>
  )
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new FyreDbConfigError("useApp must be used within an AppProvider")
  return ctx
}

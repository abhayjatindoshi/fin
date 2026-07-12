import type { ReactNode } from "react"
import { Navigate, useParams } from "react-router"
import { useApp } from "@/providers/app-provider"
import { useAppShell } from "@/features/shell/app-shell-provider"
import { Page } from "@/templates/page"
import { SubNavPage } from "@/features/shell/sub-nav-page"
import { GeneralSection } from "@/features/settings/sections/general-section"
import { ConnectionsSection } from "@/features/settings/sections/connections-section"
import { ImportsSection } from "@/features/settings/sections/imports-section"
import { RulesSection } from "@/features/settings/sections/rules-section"
import { BudgetsSection } from "@/features/settings/sections/budgets-section"

type SettingsSection = {
  readonly key: string
  readonly label: string
  readonly icon: string
  readonly element: ReactNode
}

const SECTIONS: readonly SettingsSection[] = [
  { key: "general", label: "General", icon: "settings", element: <GeneralSection /> },
  { key: "connections", label: "Connections", icon: "mail", element: <ConnectionsSection /> },
  { key: "budgets", label: "Budgets", icon: "piggy-bank", element: <BudgetsSection /> },
  { key: "imports", label: "Imports", icon: "upload", element: <ImportsSection /> },
  { key: "rules", label: "Tag Rules", icon: "sparkles", element: <RulesSection /> },
]

export function SettingsPage() {
  const { tenantId } = useParams()
  const { isMobile } = useApp()
  const basePath = `/t/${tenantId ?? ""}/settings`
  const subNav = {
    title: "Settings",
    basePath,
    items: SECTIONS.map((s) => ({ key: s.key, label: s.label, icon: s.icon })),
  }
  const { activeKey } = useAppShell({ subNav })

  if (!SECTIONS.some((s) => s.key === activeKey)) {
    if (isMobile) return <SubNavPage subNav={subNav} />
    return <Navigate to={`${basePath}/${SECTIONS[0].key}`} replace />
  }

  const element = SECTIONS.find((s) => s.key === activeKey)?.element
  return element ? <Page width="lg">{element}</Page> : null
}

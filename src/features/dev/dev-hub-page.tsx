import type { ReactNode } from "react"
import { Navigate, useParams } from "react-router"
import { useApp } from "@/providers/app-provider"
import { useAppShell } from "@/features/shell/app-shell-provider"
import { SubNavPage } from "@/features/shell/sub-nav-page"
import { LoggingSection } from "@/features/dev/sections/logging-section"
import { ComponentsSection } from "@/features/dev/sections/components-section"
import { DataSection } from "@/features/dev/sections/data-section"

/** A dev-tools section, optionally gated behind an open tenant. */
type DevSection = {
  readonly key: string
  readonly label: string
  readonly icon: string
  readonly element: ReactNode
  readonly requiresTenant?: boolean
}

const SECTIONS: readonly DevSection[] = [
  { key: "logging", label: "Logging", icon: "terminal", element: <LoggingSection /> },
  { key: "components", label: "Components", icon: "palette", element: <ComponentsSection /> },
  { key: "data", label: "Data browser", icon: "database", element: <DataSection />, requiresTenant: true },
]

/**
 * Developer tools hub. Reachable at `/dev` (non-tenant tools only) and
 * `/t/:tenantId/dev` (adds tenant-scoped tools). The data browser depends on a
 * tenant database (`useDb`), so it only appears when a tenant is open —
 * detected via the `tenantId` route param.
 */
export function DevHubPage() {
  const { tenantId } = useParams()
  const { isMobile } = useApp()
  const base = tenantId ? `/t/${tenantId}/dev` : "/dev"
  const available = SECTIONS.filter((s) => !s.requiresTenant || Boolean(tenantId))

  const subNav = {
    title: "Dev",
    basePath: base,
    items: available.map((s) => ({ key: s.key, label: s.label, icon: s.icon })),
  }
  const { activeKey } = useAppShell({ subNav })

  if (!available.some((s) => s.key === activeKey)) {
    if (isMobile) return <SubNavPage subNav={subNav} />
    return <Navigate to={`${base}/${available[0].key}`} replace />
  }

  return available.find((s) => s.key === activeKey)?.element ?? null
}

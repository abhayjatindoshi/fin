import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react"
import { FyreDbConfigError } from "@fyre-db/core"
import { useFyreDbApp, useSession } from "@fyre-db/plugins-ui"
import { SettingsService } from "@/services/settings-service"
import { AccountsService } from "@/services/accounts-service"
import { TagsService } from "@/services/tags-service"
import { ConnectionsService } from "@/services/connections-service"
import { NotificationsService } from "@/services/notifications/notifications-service"
import { TransactionsService } from "@/services/transactions-service"
import { ImportService } from "@/services/import/import-service"
import { BudgetsService } from "@/services/budgets-service"
import { BriefingService } from "@/services/briefing"
import type { Disposable } from "@/services/types"

/**
 * The per-tenant service registry. Every domain service is constructed once by
 * `ServicesProvider`, memoized on the open tenant, and disposed on tenant
 * switch. New services slot into this type + the provider's factory.
 */
export type Services = {
  readonly settings: SettingsService
  readonly accounts: AccountsService
  readonly tags: TagsService
  readonly connections: ConnectionsService
  readonly notifications: NotificationsService
  readonly transactions: TransactionsService
  readonly import: ImportService
  readonly budgets: BudgetsService
  readonly briefing: BriefingService
}

export const ServicesContext = createContext<Services | null>(null)

/** The per-tenant service registry. Throws if used before a tenant is open. */
export function useServices(): Services {
  const services = useContext(ServicesContext)
  if (!services) {
    throw new FyreDbConfigError("Services are unavailable until a household is open")
  }
  return services
}

/** Tear down every service in a registry (called on tenant switch). */
function disposeAll(services: Services): void {
  for (const service of Object.values(services) as readonly Disposable[]) {
    service.dispose()
  }
}

type ServicesProviderProps = { readonly children: ReactNode }

/**
 * Constructs and owns all per-tenant services. Rebuilds when the open tenant
 * (fyre-db instance) changes and disposes the previous set, so no service can
 * outlive its tenant. Services hydrate their own entities in their constructors.
 */
export function ServicesProvider({ children }: ServicesProviderProps) {
  const app = useFyreDbApp()
  const session = useSession()

  const services = useMemo<Services | null>(() => {
    if (!session) return null
    const fyredb = app.db
    // Construct in dependency order — Tags composes Accounts.
    const settings = new SettingsService(fyredb)
    const accounts = new AccountsService(fyredb)
    const transactions = new TransactionsService(fyredb)
    const tags = new TagsService(fyredb, accounts)
    const connections = new ConnectionsService(fyredb)
    const notifications = new NotificationsService(fyredb)
    const importSvc = new ImportService(fyredb, { transactions, notifications })
    // Budgets scopes to the selected year (Settings); Briefing composes the
    // rollup + engines over Transactions, Budgets, Tags and Settings.
    const budgets = new BudgetsService(fyredb, settings)
    const briefing = new BriefingService(fyredb, { settings, transactions, budgets })
    return {
      settings, accounts, tags, connections, notifications, transactions,
      import: importSvc, budgets, briefing,
    }
  }, [app, session])

  useEffect(() => {
    return () => { if (services) disposeAll(services) }
  }, [services])

  return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>
}

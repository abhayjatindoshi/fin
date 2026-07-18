import { AccountMarker } from "@/components/transaction/account-marker"
import { useApp } from "@/providers/app-provider"
import { useObservable } from "@/providers/use-observable"
import { useServices } from "@/providers/services-provider"

export type AccountCellProps = {
  readonly accountId: string
  readonly className?: string
}

/**
 * Resolves a transaction's account by id from the accounts service and renders
 * the layered `AccountMarker` pill. The masked number is appended on desktop
 * and dropped on mobile to save horizontal space. Returns nothing while the
 * account is unknown (e.g. before accounts have hydrated, or for an orphaned id).
 */
export function AccountCell({ accountId, className }: AccountCellProps) {
  const { isMobile } = useApp()
  const accounts = useObservable(useServices().accounts.accounts$)
  const account = accounts.find((a) => a.id === accountId)
  if (!account) return null
  return <AccountMarker account={account} variant="layered" showNumber={!isMobile} className={className} />
}

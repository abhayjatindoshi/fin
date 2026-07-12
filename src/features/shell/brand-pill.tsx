import { Logo } from "@/components/logo"
import { SyncStatus } from "@/features/shell/sync-status"
import { cn } from "@/lib/utils"

type BrandPillProps = {
  readonly className?: string
}

export function BrandPill({ className }: BrandPillProps) {
  return (
    <div className={cn("pill glass px-2", className)}>
      <Logo linked />
      <SyncStatus />
    </div>
  )
}

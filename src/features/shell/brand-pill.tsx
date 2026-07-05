import { Logo } from "@/components/logo"
import { SyncStatus } from "@/features/shell/sync-status"
import { cn } from "@/lib/utils"
import { pillVariants } from "@/ui/pill"

type BrandPillProps = {
  readonly className?: string
}

export function BrandPill({ className }: BrandPillProps) {
  return (
    <div className={cn(pillVariants({ variant: "tight" }), className)}>
      <Logo linked />
      <SyncStatus />
    </div>
  )
}

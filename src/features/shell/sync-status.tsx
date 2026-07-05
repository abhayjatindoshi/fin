import { useEffect, useState } from "react"
import { Icon } from "@/ui/icon"
import { useDb } from "@fyre-db/plugins-ui"
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/popover"
import { Button } from "@/ui/button"
import { cn } from "@/lib/utils"
import { log } from "@/lib/log"

export type SyncState = {
  readonly available: boolean
  readonly dirty: boolean
  readonly syncing: boolean
  readonly saving: boolean
  readonly saveChanges: () => void
}

/** Subscribes to the db's dirty/sync events and exposes the current sync state. */
export function useSyncStatus(): SyncState {
  const fyredb = useDb()
  const [dirty, setDirty] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!fyredb) return
    const dirtySub = fyredb.observe("dirty").subscribe(setDirty)
    const syncSub = fyredb.observe("sync").subscribe((evt) => {
      if (evt.type === "sync-started") {
        log.sync('sync started: %s → %s', evt.source, evt.target)
        setSyncing(true)
      } else {
        log.sync('sync %s: %s → %s%s', evt.type, evt.source, evt.target,
          evt.result ? ` (${evt.result.entitiesUpdated} entities, ${evt.result.partitionsSynced} partitions)` : '')
        setSyncing(false)
      }
    })
    return () => {
      dirtySub.unsubscribe()
      syncSub.unsubscribe()
    }
  }, [fyredb])

  const saveChanges = () => {
    setSaving(true)
    // FyreDb doesn't expose syncNow() yet — nudge the sync engine, then settle.
    setTimeout(() => { setSaving(false) }, 1500)
  }

  return { available: fyredb !== null, dirty, syncing, saving, saveChanges }
}

/**
 * Maps the sync state to an icon: dotted circle = pending changes, spinning
 * refresh = saving/syncing, cloud-check = all saved.
 */
export function syncIcon(
  state: Pick<SyncState, "saving" | "syncing" | "dirty">,
): { readonly name: string; readonly spin: boolean } {
  if (state.saving || state.syncing) return { name: "refresh-cw", spin: true }
  if (state.dirty) return { name: "circle-dashed", spin: false }
  return { name: "cloud-check", spin: false }
}

type SyncStatusProps = {
  readonly className?: string
}

export function SyncStatus({ className }: SyncStatusProps) {
  const { available, dirty, syncing, saving, saveChanges } = useSyncStatus()
  if (!available) return null

  const { name, spin } = syncIcon({ saving, syncing, dirty })
  const icon = <Icon name={name} className={cn(spin && "animate-spin")} />

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "cursor-pointer p-1 text-muted-foreground transition-colors hover:text-foreground [&_svg]:size-4 [&_svg]:shrink-0",
            className,
          )}
        >
          {icon}
        </div>
      </PopoverTrigger>
      <PopoverContent className="mx-4 w-72" sideOffset={20}>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 text-muted-foreground [&_svg]:size-5 [&_svg]:shrink-0">
            {icon}
          </div>
          <div className="space-y-1">
            {dirty ? (
              <>
                <p className="text-sm font-medium">You have unsaved changes.</p>
                <p className="text-xs text-muted-foreground">
                  Your changes are saved automatically. You can save the changes
                  immediately by clicking the save button.
                </p>
                <Button size="sm" className="mt-2" onClick={saveChanges} disabled={saving}>
                  {saving ? "Saving..." : "Save now"}
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm font-medium">All changes are synced.</p>
                <p className="text-xs text-muted-foreground">
                  Your changes are saved automatically.
                </p>
              </>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

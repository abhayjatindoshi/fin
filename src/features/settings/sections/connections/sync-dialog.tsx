import { useState } from "react"
import { BANK_CATALOG } from "@pai-app/adapters"
import { AdaptiveSurface } from "@/components/adaptive-surface"
import { Button } from "@/ui/button"
import { Checkbox } from "@/ui/checkbox"
import { Icon } from "@/ui/icon"
import { getBankDisplay } from "@/catalog/bank-display"
import type { IconKey } from "@/lib/icons"
import { useImportService } from "@/providers/import-provider"
import type { ConnectionView } from "@/views/connection-view"

type SelectableBank = {
  readonly bankId: string
  readonly label: string
  readonly icon: IconKey
  readonly color?: string
}

/** All banks the adapters package knows about, joined with their display
 *  details. Fixed for a package version — computed once. */
const SELECTABLE_BANKS: readonly SelectableBank[] = BANK_CATALOG.map((entry) => {
  const display = getBankDisplay(entry.bankId)
  return {
    bankId: entry.bankId,
    label: display?.label ?? entry.bankId,
    icon: display?.icon ?? "landmark",
    color: display?.color,
  }
}).sort((a, b) => a.label.localeCompare(b.label))

const ALL_BANK_IDS: readonly string[] = SELECTABLE_BANKS.map((b) => b.bankId)

type SyncDialogProps = {
  readonly connection: ConnectionView
  readonly trigger: React.ReactNode
}

/**
 * Sync-options overlay for a connected mailbox. Lets the user pick which bank
 * adapters to run and whether to reset the sweep checkpoint (re-import the
 * whole mailbox) before triggering an email sync.
 */
export function SyncDialog({ connection, trigger }: SyncDialogProps) {
  const { startEmailSync } = useImportService()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set(ALL_BANK_IDS))
  const [reset, setReset] = useState(false)

  const allSelected = selected.size === ALL_BANK_IDS.length
  const noneSelected = selected.size === 0

  const toggleBank = (bankId: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(bankId)) next.delete(bankId)
      else next.add(bankId)
      return next
    })
  }

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(ALL_BANK_IDS))
  }

  const handleStart = () => {
    // Passing every bank is equivalent to no filter — send `undefined` so the
    // sweep runs all adapters without an allow-list.
    const bankIds = allSelected ? undefined : [...selected]
    startEmailSync(connection.id, { bankIds, reset })
    setOpen(false)
    setReset(false)
  }

  const content = (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Banks to import</span>
            <Button variant="ghost" size="sm" onClick={toggleAll}>
              {allSelected ? "Clear all" : "Select all"}
            </Button>
          </div>
          <div className="flex flex-col gap-1.5">
            {SELECTABLE_BANKS.map((bank) => {
              const checked = selected.has(bank.bankId)
              return (
                <label
                  key={bank.bankId}
                  data-checked={checked}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-transparent p-2  hover:bg-muted data-[checked=true]:border-border data-[checked=true]:bg-muted/60"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => { toggleBank(bank.bankId) }}
                  />
                  <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-md"
                    style={
                      bank.color
                        ? { backgroundColor: `color-mix(in srgb, ${bank.color} 14%, transparent)` }
                        : undefined
                    }
                  >
                    <Icon
                      name={bank.icon}
                      className="size-5"
                      style={bank.color ? { color: bank.color } : undefined}
                    />
                  </span>
                  <span className="text-sm font-medium">{bank.label}</span>
                </label>
              )
            })}
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-md border p-3">
          <Checkbox
            checked={reset}
            onCheckedChange={(v) => { setReset(v === true) }}
          />
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">Reset and re-import from the beginning</span>
            <span className="text-xs text-muted-foreground">
              Clears the sync checkpoint so every matching email is scanned again from
              the newest back to the oldest. Existing transactions are de-duplicated.
            </span>
          </span>
        </label>

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => { setOpen(false) }}>
            Cancel
          </Button>
          <Button size="sm" disabled={noneSelected} onClick={handleStart}>
            <Icon name="refresh-cw" className="mr-1 size-3" />
            Start sync
          </Button>
        </div>
      </div>
    )

  return (
    <AdaptiveSurface
      open={open}
      onOpenChange={setOpen}
      trigger={trigger}
      title="Sync options"
      description={connection.email}
      content={content}
      desktop={{ type: "dialog" }}
      mobile={{ type: "drawer" }}
    />
  )
}

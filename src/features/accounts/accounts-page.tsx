import { useState } from "react"
import { Icon } from "@/ui/icon"
import { Money } from "@/components/money"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/ui/dropdown-menu"
import { getAccountDisplay } from "@/catalog/account-display"
import { KIND_DISPLAY } from "@/catalog/bank-display"
import { useObservable } from "@/providers/use-observable"
import { useServices } from "@/providers/services-provider"
import { Page } from "@/templates/page"
import { cn } from "@/lib/utils"
import type { Account } from "@/entities"
import type { AccountView } from "@/views/account-view"
import { buildAccountCardModel } from "./account-card-model"

/**
 * Accounts page. Surfaces every money account as a card showing all stored
 * metadata — useful for verifying what the importer wrote. This used to be the
 * Home surface; Home now shows the monthly briefing (attention strip), so the
 * accounts dashboard lives on its own route.
 */
export function AccountsPage() {
  const accounts = useObservable(useServices().accounts.accounts$)
  const [showArchived, setShowArchived] = useState(false)

  if (accounts.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <Icon name="home" className="size-10 text-muted-foreground" />
        <div>
          <h1 className="text-xl font-semibold">No accounts yet</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Import a statement or sync an email account to get started.
          </p>
        </div>
      </div>
    )
  }

  const active = accounts.filter((a) => !a.archived)
  const archived = accounts.filter((a) => a.archived)

  return (
    <Page className="flex flex-col gap-4">
      <h1 className="text-lg font-medium">Accounts</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {active.map((account) => (
          <AccountCard key={account.id} account={account} />
        ))}
      </div>
      {archived.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setShowArchived((v) => !v)}
            aria-expanded={showArchived}
            className="mt-2 inline-flex items-center gap-1.5 self-center rounded-full border px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Icon
              name="chevron-down"
              className={cn("size-4 transition-transform", showArchived && "rotate-180")}
            />
            {showArchived ? "Hide" : "Show"} archived ({archived.length})
          </button>
          {showArchived && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {archived.map((account) => (
                <AccountCard key={account.id} account={account} />
              ))}
            </div>
          )}
        </>
      )}
    </Page>
  )
}

/** Metadata keys promoted into the card hero (handled specially, not listed). */
const PROMOTED_KEYS = ["accountNumber"] as const

/** Human-readable labels for known metadata keys; falls back to de-camel-casing. */
const METADATA_LABEL: Readonly<Record<string, string>> = {
  accountNumber: "Account number",
  accountHolderName: "Account holder",
  ifscCode: "IFSC",
  micrCode: "MICR",
  customerId: "Customer ID",
  swiftCode: "SWIFT",
}

/** Display order for the detail rows, mirroring the account-card design. Keys
 *  absent here sort after the known ones (stable, in their stored order). */
const DETAIL_ORDER = ["accountHolderName", "ifscCode", "swiftCode", "micrCode", "customerId"]

function detailRank(key: string): number {
  const i = DETAIL_ORDER.indexOf(key)
  return i === -1 ? DETAIL_ORDER.length : i
}

/** "as of" / due-date format — "DD MMM YYYY", UTC to align with the statement's close date. */
const AS_OF_FMT = new Intl.DateTimeFormat(undefined, {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
})

function humanizeKey(key: string): string {
  return (
    METADATA_LABEL[key] ??
    key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase())
  )
}

/** Mask all but the last 4 chars of an account/card number. */
function maskNumber(value: string): string {
  const visible = value.slice(-4)
  return `•••• ${visible}`
}

/** First stored value for a metadata key, or undefined (key may be absent at runtime). */
function firstMeta(metadata: Account["metadata"], key: string): string | undefined {
  return (metadata[key] ?? [])[0]
}

function AccountCard({ account }: { account: AccountView }) {
  // The list comes from `accounts$` (reactive — re-renders when a statement is
  // imported); the masked-out `metadata` rows are read on demand from the full
  // detail. The streamed snapshot (`account.statement`) drives the figures so
  // the card stays live, while `details` only supplies the identity rows.
  const accounts = useServices().accounts
  const details = accounts.getAccountDetails(account.id)
  const [editing, setEditing] = useState(false)
  if (!details) return null

  const model = buildAccountCardModel(account.kind, account.statement)

  const display = getAccountDisplay(account)

  const accountNumber = firstMeta(details.metadata, "accountNumber")
  const detailRows = Object.entries(details.metadata)
    .filter(
      ([key, v]) => v.length > 0 && !PROMOTED_KEYS.includes(key as (typeof PROMOTED_KEYS)[number]),
    )
    .sort(([a], [b]) => detailRank(a) - detailRank(b))

  return (
    <div className="group/card relative flex h-full flex-col overflow-hidden rounded-xl border">
      {/* TEMP: rename + archive actions, top-right corner (always shown). */}
      <div className="absolute right-2 top-2 z-10 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label="Rename account"
          className="rounded-full bg-black/25 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black/45"
        >
          <Icon name="pencil-line" className="size-4" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Account actions"
            className="rounded-full bg-black/25 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black/45"
          >
            <Icon name="ellipsis-vertical" className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setEditing(true)}>
              <Icon name="pencil-line" /> Rename
            </DropdownMenuItem>
            {account.archived ? (
              <DropdownMenuItem onSelect={() => accounts.restore(account.id)}>
                <Icon name="archive-restore" /> Restore
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onSelect={() => accounts.archive(account.id)}>
                <Icon name="archive" /> Archive
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Enlarged, faded kind icon embedded in the card background — tinted
          with the bank's brand color when known, else neutral. Sits in the
          right margin of the content band (above the details footer). */}
      <Icon
        name={KIND_DISPLAY[account.kind].icon}
        aria-hidden
        style={display.color ? { color: display.color } : undefined}
        className={`pointer-events-none absolute right-2 top-10 size-24 -rotate-12 ${
          display.color ? "opacity-[0.18]" : "text-muted-foreground/25"
        }`}
      />

      {/* Frosted-glass top band: a brand-tinted gradient fading to transparent,
          with a slight backdrop blur over the watermark icon for a glass feel. */}
      <div
        aria-hidden
        style={
          display.color
            ? { background: `linear-gradient(to bottom, color-mix(in srgb, ${display.color} 28%, transparent), transparent)` }
            : undefined
        }
        className={`pointer-events-none absolute inset-x-0 top-0 h-24 backdrop-blur-[2px] ${
          display.color ? "" : "bg-linear-to-b from-muted/50 to-transparent"
        }`}
      />

      {/* Header: bank identity. Actions float in the top-right corner (above). */}
      <div className="relative flex min-w-0 items-center gap-2.5 p-4 pb-0">
        <Icon name={display.icon} className="size-8 shrink-0" />
        <div className="min-w-0">
          {editing ? (
            <RenameField
              initial={account.name}
              onSave={(name) => {
                if (name) accounts.update(account.id, { name })
                setEditing(false)
              }}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <>
              <div className="truncate text-base leading-tight">{display.label}</div>
              <div className="truncate text-xs text-muted-foreground">{display.sublabel}</div>
            </>
          )}
        </div>
      </div>

      {/* Figures: masked number (left) + balance/due (right), pinned just above
          the metadata divider. */}
      <div className="relative mt-auto flex items-end justify-between gap-3 px-4 pb-3 pt-4">
        <div className="min-w-0">
          {accountNumber && <AccountNumber value={accountNumber} />}
        </div>
        <div className="shrink-0 text-right">
          <div className="leading-tight">
            {model.amount !== undefined ? (
              <Money
                amount={model.amount}
                currency={account.currency}
                variant="icon"
                sign={model.amount < 0}
                className="justify-end text-2xl font-normal"
              />
            ) : (
              <span className="text-2xl font-normal text-muted-foreground">—</span>
            )}
          </div>
          {model.hasStatement && model.asOf !== undefined ? (
            <div className="text-xs text-muted-foreground">as of {AS_OF_FMT.format(model.asOf)}</div>
          ) : (
            <div className="text-xs text-muted-foreground">No statement yet</div>
          )}
          {account.archived && (
            <span className="mt-1 inline-block rounded bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
              Archived
            </span>
          )}
        </div>
      </div>

      {/* Details — uppercase label (left) / right-aligned value. The credit-limit
          row is a synthetic, currency-formatted meta (sourced from the typed
          snapshot, never the metadata string-bag). */}
      <dl className="relative flex flex-col gap-1.5 border-t px-4 py-3 text-sm">
        {model.isCreditCard && model.minimumDue !== undefined && (
          <Row label="Min due" value={<Money amount={model.minimumDue} currency={account.currency} />} />
        )}
        {model.isCreditCard && model.dueDate !== undefined && (
          <Row label="Due date" value={AS_OF_FMT.format(model.dueDate)} />
        )}
        {detailRows.map(([key, values]) => (
          <Row key={key} label={humanizeKey(key)} value={values.join(", ")} copyText={values.join(", ")} />
        ))}
        {model.metaRows.map((row) => (
          <Row
            key={row.key}
            label={row.label}
            value={<Money amount={row.amount} currency={account.currency} />}
          />
        ))}
        <Row label="Currency" value={account.currency} copyText={account.currency} />
        {account.icon && <Row label="Icon" value={account.icon} copyText={account.icon} />}
      </dl>
    </div>
  )
}

/** TEMP: inline rename input for the account name — saves on Enter/blur, cancels on Escape. */
function RenameField({
  initial,
  onSave,
  onCancel,
}: {
  initial: string
  onSave: (name: string) => void
  onCancel: () => void
}) {
  const [value, setValue] = useState(initial)
  return (
    <input
      autoFocus
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onSave(value.trim())
        if (e.key === "Escape") onCancel()
      }}
      onBlur={() => onSave(value.trim())}
      aria-label="Account name"
      className="w-full rounded border bg-background px-1.5 py-0.5 text-sm"
    />
  )
}

/** The masked account number with a reveal toggle and a copy-to-clipboard button. */
function AccountNumber({ value }: { value: string }) {
  const [revealed, setRevealed] = useState(false)
  // Some stored numbers are already partly masked (e.g. "XXXX1234", "••••1234").
  // There's nothing to reveal there, so show the stored value and drop the eye.
  const alreadyMasked = /[x*•·.]/i.test(value)
  return (
    <div className="group flex items-center gap-2">
      <span className="font-mono text-xl tracking-widest text-foreground">
        {revealed ? value : maskNumber(value)}
      </span>
      {!alreadyMasked && (
        <button
          type="button"
          onClick={() => setRevealed((v) => !v)}
          aria-label={revealed ? "Hide account number" : "Show account number"}
          aria-pressed={revealed}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Icon name={revealed ? "eye-off" : "eye"} className="size-4" />
        </button>
      )}
      <CopyButton
        value={value}
        label="account number"
        className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
      />
    </div>
  )
}

/** Copies `value` to the clipboard, flashing a check for confirmation. */
function CopyButton({ value, label, className }: { value: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(value)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1500)
      }}
      aria-label={copied ? "Copied" : `Copy ${label ?? "value"}`}
      className={cn(
        "rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground",
        className,
      )}
    >
      <Icon name={copied ? "check" : "copy"} className="size-3.5" />
    </button>
  )
}

function Row({
  label,
  value,
  copyText,
}: {
  label: string
  value: React.ReactNode
  copyText?: string
}) {
  return (
    <div className="group flex items-center justify-between gap-4">
      <dt className="shrink-0 text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="flex min-w-0 items-center justify-end gap-1">
        {copyText && (
          <CopyButton
            value={copyText}
            label={label}
            className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          />
        )}
        <span className="min-w-0 truncate text-right">{value}</span>
      </dd>
    </div>
  )
}
import { useState, type ReactNode } from "react"
import { Button } from "@/ui/button"
import { Currency } from "@/components/currency"
import { Icon } from "@/ui/icon"
import { Money } from "@/components/money"
import { PillBar } from "@/ui/pill-bar"
import { tagIconName } from "@/catalog/icon-resolve"
import { Text } from "@/ui/text"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { FullPageSpinner } from "@/components/full-page-spinner"
import { Logo } from "@/components/logo"
import { SyncStatus } from "@/features/shell/sync-status"
import { TagPicker } from "@/features/transactions/containers/tag-picker"
import { TagCell } from "@/components/transaction/tag-cell"
import { AccountMarker } from "@/components/transaction/account-marker"
import { ACCOUNT_MARKER_VARIANTS, type AccountMarkerVariant } from "@/components/transaction/account-marker-variants"
import {
  TransactionRowVariantA,
  TransactionRowVariantB,
  TransactionRowVariantC,
} from "@/components/transaction/row-variants"
import type { AccountView } from "@/views/account-view"
import type { TagView } from "@/views/tag-view"
import { useServices } from "@/providers/services-provider"

function Section({ title, children }: { readonly title: string; readonly children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <Text as="h2" variant="heading">{title}</Text>
      <div className="flex flex-wrap items-start gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        {children}
      </div>
    </section>
  )
}

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "JPY", "GEL", "PHP", "RUB", "SAR", "CHF", "TRY"] as const

/**
 * Design-system showcase, rendered inside the dev hub's Components section.
 * Renders Pai's app-specific components and formatters. Built-in shadcn
 * primitives (Button, Card, etc.) are intentionally omitted — they're
 * documented upstream.
 */
export function ComponentsSection() {
  return (
    <div className="flex flex-col gap-10">

      <Section title="Logo">
        <Logo className="h-8 w-auto" />
        <Logo className="h-12 w-auto" />
      </Section>

      <Section title="Theme switcher">
        <ThemeSwitcher />
      </Section>

      <Section title="Sync status">
        <SyncStatus />
      </Section>

      <Section title="Notifications (toast — non-persistent)">
        <NotificationDemo />
      </Section>

      <Section title="Full-page spinner">
        <div className="w-full">
          <Text variant="caption">Inline preview (height-bounded)</Text>
          <div className="mt-2 flex h-40 items-center justify-center rounded-md border border-border/50">
            <FullPageSpinner message="Loading…" />
          </div>
        </div>
      </Section>

      <Section title="Tag picker">
        <TagPickerDemo />
      </Section>

      <Section title="Transaction row variants (date lives in the day header)">
        <TransactionRowVariantsDemo />
      </Section>

      <Section title="Variant C — mobile vs desktop">
        <VariantCResponsiveDemo />
      </Section>

      <Section title="Icon (lazy-loaded by name)">
        <Icon name="wallet" className="size-5" />
        <Icon name="coffee" className="size-5" />
        <Icon name="plane" className="size-5" />
        <Icon name="indian-rupee" className="size-5" />
        <Icon name="dollar-sign" className="size-5" />
        <Icon name="netflix" className="size-5" />
        <Icon name="spotify" className="size-5" />
      </Section>

      <Section title="Text variants">
        <Text variant="title">Title</Text>
        <Text variant="heading">Heading</Text>
        <Text variant="default">Default</Text>
        <Text variant="muted">Muted</Text>
        <Text variant="caption">Caption</Text>
        <Text variant="label">label</Text>
        <Text variant="destructive">Destructive</Text>
      </Section>

      <Section title="Pill">
        <span className="pill glass px-3">Label</span>
        <button type="button" className="pill glass cursor-pointer px-3">
          <Icon name="calendar" />
          <span>With icon</span>
          <Icon name="chevron-down" />
        </button>
        <button type="button" className="pill glass aspect-square cursor-pointer p-0">
          <Icon name="user" />
        </button>
        <span className="pill glass px-2">
          <Logo className="h-5 w-auto" />
        </span>
        <span className="pill px-3 ring-1 ring-border">Flat (no glass)</span>
      </Section>

      <Section title="Pill bar">
        <div className="w-full max-w-md">
          <PillBar
            surface="glass"
            className="min-w-0"
            items={Array.from({ length: 4 }, (_, i) => ({
              key: String(i),
              element: <span className="relative z-10">Item {i + 1}</span>,
              active: i === 0,
            }))}
          />
        </div>
      </Section>

      <Section title="Currency — variants">
        {CURRENCIES.map((code) => (
          <div key={code} className="flex w-24 flex-col items-center gap-1 rounded-md bg-muted/30 p-2">
            <Currency code={code} variant="icon" className="size-5" />
            <Currency code={code} variant="text" className="text-base" />
            <Currency code={code} variant="code" className="text-xs text-muted-foreground" />
          </div>
        ))}
      </Section>

      <Section title="Money — default (locale-aware)">
        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
          {CURRENCIES.map((code) => (
            <div key={code} className="flex items-center justify-between gap-3 rounded-md bg-muted/30 px-3 py-2">
              <Text variant="caption">{code}</Text>
              <Money amount={123456789} currency={code} />
            </div>
          ))}
          <div className="flex items-center justify-between gap-3 rounded-md bg-destructive/10 px-3 py-2">
            <Text variant="caption">negative INR</Text>
            <Money amount={-123450} currency="INR" />
          </div>
        </div>
      </Section>

      <Section title="Money — icon variant">
        <Money amount={123450} currency="INR" variant="icon" />
        <Money amount={-123450} currency="INR" variant="icon" />
        <Money amount={4200} currency="USD" variant="icon" />
        <Money amount={9999} currency="JPY" variant="icon" />
      </Section>

    </div>
  )
}

/**
 * Fires toast-only notifications (`channels: ["toast"]`, `fyredb: null`) — no
 * inbox row is written, demonstrating non-persistent delivery.
 */
function NotificationDemo() {
  const notificationsService = useServices().notifications
  const fire = (display: "info" | "success" | "warning" | "error") => {
    notificationsService.notify({
      kind: "showcase-demo",
      display,
      title: `${display[0].toUpperCase()}${display.slice(1)} toast`,
      body: "Transient notification — not stored in the inbox.",
    }, { channels: ["toast"] })
  }

  const firePersistent = (display: "info" | "success" | "warning" | "error") => {
    notificationsService.notify({
      kind: "showcase-demo",
      display,
      title: `${display[0].toUpperCase()}${display.slice(1)} notification`,
      body: "Persistent notification — stored in the inbox.",
      actionLabel: "View",
    }, { channels: ["inbox", "toast"] })
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => { fire("info") }}>Info</Button>
        <Button variant="outline" onClick={() => { fire("success") }}>Success</Button>
        <Button variant="outline" onClick={() => { fire("warning") }}>Warning</Button>
        <Button variant="outline" onClick={() => { fire("error") }}>Error</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => { firePersistent("info") }}>Persist info</Button>
        <Button onClick={() => { firePersistent("success") }}>Persist success</Button>
        <Button onClick={() => { firePersistent("warning") }}>Persist warning</Button>
        <Button onClick={() => { firePersistent("error") }}>Persist error</Button>
      </div>
    </div>
  )
}

function TagPickerDemo() {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<TagView | null>(null)

  return (
    <div className="flex flex-col items-start gap-3">
      <TagPicker
        open={open}
        onOpenChange={setOpen}
        selectedTagId={selected?.id ?? null}
        onSelect={setSelected}
      >
        <Button variant="outline">
          {selected ? (
            <>
              <Icon name={tagIconName(selected)} className="size-4" />
              {selected.name}
            </>
          ) : (
            "Pick a tag…"
          )}
        </Button>
      </TagPicker>
      <Text variant="caption">
        {selected ? `Selected id: ${selected.id}` : "No tag selected"}
      </Text>
    </div>
  )
}

/**
 * Compares the three candidate mobile-density row layouts side by side. The
 * date column is intentionally absent — it moves into the day-group header in
 * the unified layout. Sample tag/account cells are static stand-ins for the
 * service-resolved cells the real page injects.
 */
function TransactionRowVariantsDemo() {
  const [marker, setMarker] = useState<AccountMarkerVariant>("current")
  const hdfcBank: AccountView = {
    id: "acct-hdfc-savings",
    name: "HDFC Savings",
    kind: "bank",
    currency: "INR",
    maskedNumber: "****1234",
    bankId: "hdfc",
    offeringId: "savings",
    archived: false,
  }
  const hdfcCard: AccountView = {
    id: "acct-hdfc-cc",
    name: "HDFC Credit Card",
    kind: "credit-card",
    currency: "INR",
    maskedNumber: "****5678",
    bankId: "hdfc",
    offeringId: "credit-card",
    archived: false,
  }
  const federalCard: AccountView = {
    id: "acct-federal-cc",
    name: "Federal Credit Card",
    kind: "credit-card",
    currency: "INR",
    maskedNumber: "****9012",
    bankId: "federal",
    offeringId: "credit-card",
    archived: false,
  }
  const groceriesTag: TagView = { id: "tag-groceries", name: "Groceries", icon: "shopping-cart" }
  const salaryTag: TagView = { id: "tag-salary", name: "Salary", icon: "wallet" }

  const samples = [
    { amount: -125000, title: "Blinkit", narration: "UPI/BLINKIT/402938475", tag: groceriesTag, account: hdfcBank },
    { amount: -45999, title: null, narration: "POS 5678 SWIGGY BANGALORE IN", tag: null, account: hdfcCard },
    { amount: 5000000, title: "Monthly salary", narration: "NEFT CR ACME CORP SALARY", tag: salaryTag, account: federalCard },
  ] as const

  const renderTag = (tag: TagView | null) => <TagCell tag={tag} className="pointer-events-none rounded-full" />

  const variants = [
    { key: "A", label: "Variant A — icon-led single line", Row: TransactionRowVariantA },
    { key: "B", label: "Variant B — two-tier compact", Row: TransactionRowVariantB },
    { key: "C", label: "Variant C — amount-led single line", Row: TransactionRowVariantC },
  ] as const

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-row flex-wrap items-center gap-2">
        <Text variant="caption">Account marker</Text>
        {ACCOUNT_MARKER_VARIANTS.map((v) => (
          <Button
            key={v}
            size="sm"
            variant={v === marker ? "default" : "outline"}
            onClick={() => { setMarker(v) }}
          >
            {v}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {variants.map(({ key, label, Row }) => (
          <div key={key} className="flex flex-col gap-2">
            <Text variant="caption">{label}</Text>
            <div className="text-[15px]">
              {samples.map((s, i) => (
                <Row
                  key={i}
                  amount={s.amount}
                  title={s.title}
                  narration={s.narration}
                  tagCell={renderTag(s.tag)}
                  accountCell={<AccountMarker account={s.account} variant={marker} />}
                  first={i === 0}
                  last={i === samples.length - 1}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Shows the chosen Variant C in two framings: a phone-width column (icon-only
 * account marker, densest) and a full-width desktop column (icon + last-4).
 * Both use the same row component — only the container width and the injected
 * account marker differ, illustrating how the one row adapts across breakpoints.
 */
function VariantCResponsiveDemo() {
  const hdfcBank: AccountView = {
    id: "acct-hdfc-savings",
    name: "HDFC Savings",
    kind: "bank",
    currency: "INR",
    maskedNumber: "****1234",
    bankId: "hdfc",
    offeringId: "savings",
    archived: false,
  }
  const federalCard: AccountView = {
    id: "acct-federal-cc",
    name: "Federal Credit Card",
    kind: "credit-card",
    currency: "INR",
    maskedNumber: "****9012",
    bankId: "federal",
    offeringId: "credit-card",
    archived: false,
  }
  const groceriesTag: TagView = { id: "tag-groceries", name: "Groceries", icon: "shopping-cart" }
  const salaryTag: TagView = { id: "tag-salary", name: "Salary", icon: "wallet" }

  const samples = [
    { amount: -125000, title: "Blinkit", narration: "UPI/BLINKIT/402938475", tag: groceriesTag, account: hdfcBank },
    { amount: -45999, title: null, narration: "POS 5678 SWIGGY BANGALORE IN", tag: null, account: hdfcBank },
    { amount: 5000000, title: "Monthly salary", narration: "NEFT CR ACME CORP SALARY", tag: salaryTag, account: federalCard },
  ] as const

  const rows = (marker: AccountMarkerVariant, showNumber?: boolean) =>
    samples.map((s, i) => (
      <TransactionRowVariantC
        key={i}
        amount={s.amount}
        title={s.title}
        narration={s.narration}
        tagCell={<TagCell tag={s.tag} className="pointer-events-none rounded-full" />}
        accountCell={<AccountMarker account={s.account} variant={marker} showNumber={showNumber} />}
        first={i === 0}
        last={i === samples.length - 1}
      />
    ))

  return (
    <div className="flex w-full flex-col items-start gap-8 lg:flex-row">
      <div className="flex flex-col gap-2">
        <Text variant="caption">Mobile — 390px, layered icon</Text>
        <div className="w-97.5 max-w-full rounded-2xl border bg-background p-2 text-[15px] shadow-sm">
          {rows("layered")}
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Text variant="caption">Desktop — full width, layered icon + last-4</Text>
        <div className="rounded-xl border bg-background p-2 text-[15px]">
          {rows("layered", true)}
        </div>
      </div>
    </div>
  )
}

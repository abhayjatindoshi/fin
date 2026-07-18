import { Icon } from "@/ui/icon"
import { Text } from "@/ui/text"
import { BANK_DISPLAY } from "@/catalog/bank-display"

type SupportedBank = {
  readonly label: string
  readonly icon: string
  readonly color?: string
  readonly offerings: readonly string[]
}

const BANKS: readonly SupportedBank[] = Object.values(BANK_DISPLAY).map((bank) => ({
  label: bank.label,
  icon: bank.icon,
  color: bank.color,
  offerings: Object.values(bank.offerings).map((offering) => offering.label),
}))

/** One bank tile — brand icon, name, and the offerings Pai can parse for it. */
function BankTile({ bank }: { readonly bank: SupportedBank }) {
  return (
    <div className="flex w-72 shrink-0 flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
      <div className="flex items-center gap-3">
        <span
          className="flex size-11 items-center justify-center rounded-xl"
          style={bank.color ? { backgroundColor: `${bank.color}1a`, color: bank.color } : undefined}
        >
          <Icon name={bank.icon} className="size-6" />
        </span>
        <h3 className="font-heading text-base font-semibold">{bank.label}</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {bank.offerings.map((offering) => (
          <span
            key={offering}
            className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
          >
            {offering}
          </span>
        ))}
      </div>
    </div>
  )
}

/**
 * Marketing section: an auto-scrolling strip of every bank `@pai-app/adapters`
 * supports, each showing the offerings Pai can parse. The track renders the
 * bank list twice so the CSS marquee loops seamlessly; it pauses on hover.
 * Sourced from `BANK_DISPLAY`, so new adapters surface here automatically.
 */
export function SupportedBanks() {
  return (
    <section className="relative py-16 lg:py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 left-1/2 -z-10 size-112 -translate-x-1/2 rounded-full bg-accent/10 blur-3xl"
      />

      <div className="mx-auto flex max-w-xl flex-col items-center gap-3 px-6 text-center">
        <Text variant="label" className="text-accent">Works with your banks</Text>
        <h2 className="font-heading text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          {BANKS.length} banks, parsed out of the box
        </h2>
        <p className="text-pretty text-muted-foreground">
          Pai reads statements from these banks automatically — with more added
          all the time.
        </p>
      </div>

      {/* Edge-faded viewport; the track scrolls and pauses on hover. */}
      <div className="group relative mt-12 overflow-hidden mask-[linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div className="flex w-max gap-4 animate-marquee group-hover:paused">
          {[...BANKS, ...BANKS].map((bank, i) => (
            <BankTile key={`${bank.label}-${i}`} bank={bank} />
          ))}
        </div>
      </div>
    </section>
  )
}

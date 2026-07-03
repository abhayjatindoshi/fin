import { Icon } from "@/ui/icon"
import { Money } from "@/components/money"
import { Progress } from "@/ui/progress"
import { useObservable } from "@/providers/use-observable"
import { useServices } from "@/providers/services-provider"
import { cn } from "@/lib/utils"
import type {
  BriefingView,
  BriefingHeadline,
  BriefingClub,
  BriefingAppreciation,
  BriefingProgress,
} from "@/views/briefing-view"

/**
 * Home — the monthly briefing (§11, §15). Answers "what wasn't like you this
 * month, and what did you ask me to watch" — a briefing, not a dashboard
 * (docs/pai-philosophy.md). The accounts dashboard moved to its own page; Home
 * is the attention surface.
 *
 * Three states, in priority:
 *   1. no data for the year → get-started note
 *   2. adverse standouts    → the attention strip (headlines + clubbed tail)
 *   3. a calm month         → the good-month note (a first-class answer, §9)
 * Budget progress bars (Rule 1) show underneath, independent of the strip.
 */
export function HomePage() {
  const briefing = useObservable(useServices().briefing.briefing$)

  if (!briefing.hasData) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <Icon name="sparkles" className="size-10 text-muted-foreground" />
        <div>
          <h1 className="text-xl font-semibold">Nothing to brief yet</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Import a statement for this year and your monthly briefing will appear here.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4">
      <Header briefing={briefing} />
      <AttentionSection briefing={briefing} />
      {briefing.progress.length > 0 && <ProgressSection rows={briefing.progress} />}
    </div>
  )
}

function Header({ briefing }: { briefing: BriefingView }) {
  const calm = briefing.headlines.length === 0 && briefing.club === undefined
  return (
    <div className="flex flex-col gap-0.5">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{briefing.monthLabel}</div>
      <h1 className="text-xl font-semibold">
        {calm ? "A calm month" : "Worth a look"}
      </h1>
    </div>
  )
}

/** The attention strip: adverse headlines + clubbed tail, or the calm-month note. */
function AttentionSection({ briefing }: { briefing: BriefingView }) {
  const { headlines, club, appreciations } = briefing

  if (headlines.length === 0 && club === undefined) {
    return <CalmMonth appreciations={appreciations} />
  }

  return (
    <div className="flex flex-col gap-3">
      {headlines.map((h) => (
        <HeadlineCard key={h.tagId} headline={h} />
      ))}
      {club && <ClubRow club={club} />}
    </div>
  )
}

/**
 * One adverse standout — "₹5k over your usual Rent". The ₹ gap is the headline;
 * the % and the this-month/expected pair are the supporting detail (§15.3).
 */
function HeadlineCard({ headline }: { headline: BriefingHeadline }) {
  const pct = Math.round(Math.abs(headline.deviationFraction) * 100)
  const over = headline.deviationAmount > 0
  const verb = headline.direction === "floor" ? (over ? "above" : "below") : over ? "over" : "under"

  return (
    <div className="flex items-start gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-500/15">
        <Icon name={headline.icon} className="size-4 text-amber-600 dark:text-amber-400" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-medium">{headline.name}</span>
          <Money amount={Math.abs(headline.deviationAmount)} className="font-semibold" />
        </div>
        <div className="text-xs text-muted-foreground">
          {pct}% {verb} your usual{" "}
          <Money amount={headline.expected} className="text-foreground/70" /> — this month{" "}
          <Money amount={headline.thisMonth} className="text-foreground/70" />
        </div>
      </div>
    </div>
  )
}

/** The folded minor-mover tail — a tappable summary, never a truncation (§15.3). */
function ClubRow({ club }: { club: BriefingClub }) {
  const names = club.members.map((m) => m.name).join(", ")
  return (
    <div className="flex items-center gap-3 rounded-xl bg-muted/40 px-4 py-3 text-sm">
      <Icon name="chart-candlestick" className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1 text-muted-foreground">
        <span className="text-foreground">{club.count} smaller {club.count === 1 ? "move" : "moves"}</span>
        {" — "}
        <Money amount={club.combinedAmount} className="text-foreground/80" /> combined
        <div className="truncate text-xs">{names}</div>
      </div>
    </div>
  )
}

/** The good-month note (§15.5): favorable standouts, or a plain calm line. */
function CalmMonth({ appreciations }: { appreciations: readonly BriefingAppreciation[] }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 px-4 py-4">
        <Icon name="circle-check" className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <p className="text-sm">
          Nothing unusual this month. Your spending looked like you.
        </p>
      </div>
      {appreciations.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">A few wins</div>
          {appreciations.map((a) => (
            <div key={a.tagId} className="flex items-center gap-3 px-1 text-sm">
              <Icon name={a.icon} className="size-4 shrink-0 text-muted-foreground" />
              <span className="flex-1">{a.name}</span>
              <span className="text-emerald-600 dark:text-emerald-400">
                <Money amount={a.magnitude} /> less than usual
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/** Budgeted categories (Rule 1): raw progress toward the line — always shown. */
function ProgressSection({ rows }: { rows: readonly BriefingProgress[] }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">What you're watching</div>
      {rows.map((row) => (
        <ProgressRow key={row.tagId} row={row} />
      ))}
    </div>
  )
}

function ProgressRow({ row }: { row: BriefingProgress }) {
  const pct = Math.min(100, Math.round(row.fraction * 100))
  // A ceiling over 100% is a warning; a floor under 100% is the incomplete case.
  const over = row.fraction > 1
  const warn = row.direction === "ceiling" ? over : false
  return (
    <div className="flex flex-col gap-1.5 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon name={row.icon} className="size-4 text-muted-foreground" />
          <span className="font-medium">{row.name}</span>
          <span className="text-xs text-muted-foreground">
            {row.period === "yearly" ? "yearly" : "monthly"}
          </span>
        </div>
        <div className="text-sm">
          <Money amount={row.spent} className={cn(warn && "text-amber-600 dark:text-amber-400")} />
          <span className="text-muted-foreground"> / </span>
          <Money amount={row.budget} className="text-muted-foreground" />
        </div>
      </div>
      <Progress value={pct} className={cn(warn && "[&>[data-slot=progress-indicator]]:bg-amber-500")} />
    </div>
  )
}

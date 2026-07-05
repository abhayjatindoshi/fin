import { useMemo, type ReactNode } from "react"
import { Icon } from "@/ui/icon"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/ui/dropdown-menu"
import { useObservable } from "@/providers/use-observable"
import { useServices } from "@/providers/services-provider"
import { cn } from "@/lib/utils"
import { pillVariants } from "@/ui/pill"

const MONTH_SHORT = [
  "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

/** "26" → "'26". */
function shortYear(year: number): string {
  return `'${String(year).slice(-2)}`
}

/** Month label rendered smaller and slightly muted. */
function MonthLabel({ children }: { readonly children: ReactNode }) {
  return <span className="text-[0.7em] font-medium text-muted-foreground">{children}</span>
}

/**
 * Vertical month/year stack: small uppercase month on top, year below.
 * Both share the surrounding text color (no muted variant).
 */
function MonthYearStack({ month, year }: { readonly month: string; readonly year: number }) {
  return (
    <span className="inline-flex flex-col items-center leading-none">
      <span className="text-[0.6em] font-semibold uppercase tracking-wider">{month}</span>
      <span className="mt-0.5">{shortYear(year)}</span>
    </span>
  )
}

/**
 * Trigger label — uses the vertical month/year stack for fiscal-year ranges
 * so the start/end months stay visible.
 */
function formatYearTrigger(year: number, firstMonth: number): ReactNode {
  if (firstMonth === 1) return shortYear(year)
  return (
    <>
      <MonthYearStack month={MONTH_SHORT[firstMonth]} year={year} />
      <span className="text-muted-foreground">-</span>
      <MonthYearStack month={MONTH_SHORT[firstMonth - 1]} year={year + 1} />
    </>
  )
}

/**
 * Dropdown item label — horizontal layout with muted month labels. Items have
 * room to breathe here, so the stack treatment isn't needed.
 */
function formatYearMenuItem(year: number, firstMonth: number): ReactNode {
  if (firstMonth === 1) return shortYear(year)
  return (
    <>
      <MonthLabel>{MONTH_SHORT[firstMonth]}</MonthLabel>
      <span>{shortYear(year)}</span>
      <span className="text-muted-foreground">-</span>
      <MonthLabel>{MONTH_SHORT[firstMonth - 1]}</MonthLabel>
      <span>{shortYear(year + 1)}</span>
    </>
  )
}

const RANGE = 3

type YearPillProps = {
  readonly className?: string
}

export function YearPill({ className }: YearPillProps) {
  const { settings: settingsService } = useServices()
  const settings = useObservable(settingsService.settings$)
  const year = useObservable(settingsService.selectedYear$)
  const { firstMonth } = settings

  const today = new Date()
  const currentMonth = today.getMonth() + 1
  const currentFy = currentMonth >= firstMonth ? today.getFullYear() : today.getFullYear() - 1

  // Static window of `currentFy ± RANGE`. Dropdown does not drift as the user
  // navigates years.
  const years = useMemo(() => {
    const out: number[] = []
    for (let y = currentFy - RANGE; y <= currentFy + RANGE; y++) out.push(y)
    return out
  }, [currentFy])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Select year"
          className={cn(pillVariants({ variant: "label", interactive: true }), "font-medium", className)}
        >
          <Icon name="calendar" className="size-4 text-muted-foreground" />
          <span className="flex items-center gap-1">{formatYearTrigger(year, firstMonth)}</span>
          <Icon name="chevron-down" className="size-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={10} className="min-w-36">
        <DropdownMenuRadioGroup
          value={String(year)}
          onValueChange={(v) => { settingsService.setSelectedYear(Number(v)); }}
        >
          {years.map((y) => (
            <DropdownMenuRadioItem key={y} value={String(y)}>
              <span className="flex items-baseline gap-1">{formatYearMenuItem(y, firstMonth)}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

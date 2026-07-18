import { cn } from "@/lib/utils"

/** Shared transaction-row shell — table-style borders that round at the group's ends. */
export function transactionRowFrame(first?: boolean, last?: boolean, selected?: boolean): string {
  return cn(
    "flex min-h-12 flex-row items-center border-x border-b px-3 hover:bg-muted/50 sm:px-4",
    first && "rounded-t-lg border-t",
    last && "rounded-b-lg",
    selected && "bg-secondary/80",
  )
}

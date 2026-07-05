import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * The shared chrome-pill primitive. Every floating AppBar control (household,
 * year, nav item, profile, filters, search, section switcher, month header) is
 * built from this so height, radius, glass, and the active state stay uniform.
 *
 * Padding/shape is overridable: `variant` picks a sensible default and any
 * caller can nudge it via `className` (merged last). Style any element with
 * `pillVariants(...)`, or render the `Pill` component directly (supports
 * `asChild` for dropdown/popover triggers).
 */
const pillVariants = cva(
  "glass inline-flex h-10 items-center justify-center gap-2 rounded-full text-sm whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /** Text pill with an icon/label (household, year, filters, nav). */
        label: "px-3",
        /** Icon-only square (profile, collapsed search, mobile nav). */
        icon: "size-10 p-0",
        /** Reduced padding for the logo/brand cluster. */
        tight: "px-2",
        /** Wraps a form control (search input). */
        input: "px-3",
        /** Segmented container (e.g. a status toggle). */
        group: "gap-0 p-0.5",
      },
      /** The single active-state language: a soft-solid fill. */
      active: {
        true: "bg-primary/15 text-foreground",
        false: "",
      },
      interactive: {
        true: "cursor-pointer",
        false: "",
      },
    },
    defaultVariants: {
      variant: "label",
      active: false,
      interactive: false,
    },
  },
)

type PillProps = React.ComponentProps<"div"> &
  VariantProps<typeof pillVariants> & {
    readonly asChild?: boolean
  }

function Pill({ className, variant, active, interactive, asChild = false, ...props }: PillProps) {
  const Comp = asChild ? Slot.Root : "div"
  return (
    <Comp
      data-slot="pill"
      className={cn(pillVariants({ variant, active, interactive, className }))}
      {...props}
    />
  )
}

export { Pill, pillVariants }

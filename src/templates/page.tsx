import type { CSSProperties, ReactNode } from "react"
import { cn } from "@/lib/utils"

/** Content-column widths for the page's centred max-width box. */
const WIDTHS = {
  sm: "28rem",
  md: "42rem",
  lg: "64rem",
  full: "100%",
} as const

export type PageWidth = keyof typeof WIDTHS

export type PageProps = {
  readonly children: ReactNode
  /** Max width of the centred content column. Default `md`. */
  readonly width?: PageWidth
  /** Override every gutter side for this page (e.g. `--spacing(2)`). */
  readonly gutter?: string
  /** Override the top gutter only. */
  readonly gutterTop?: string
  /** Override the right gutter only. */
  readonly gutterRight?: string
  /** Override the bottom gutter only. */
  readonly gutterBottom?: string
  /** Override the left gutter only. */
  readonly gutterLeft?: string
  readonly className?: string
}

/**
 * The standard page box: a centred, max-width column padded by the shared
 * gutter tokens (`--page-gutter-*`, responsive off `--gutter`). Children that
 * need to reach the edge use `<Bleed>`. Pages that want total control (e.g.
 * virtualized lists) can skip `<Page>` and render straight into the shell.
 *
 * The `gutter*` props set the effective `--gutter-top` / `-right` / `-bottom` /
 * `-left` inline, so both the padding here and any `<Bleed>` inside track the
 * override.
 */
export function Page({
  children,
  width = "full",
  gutter,
  gutterTop,
  gutterRight,
  gutterBottom,
  gutterLeft,
  className,
}: PageProps) {
  const top = gutterTop ?? gutter
  const right = gutterRight ?? gutter
  const bottom = gutterBottom ?? gutter
  const left = gutterLeft ?? gutter
  const style = {
    "--page-w": WIDTHS[width],
    ...(top ? { "--gutter-top": top } : {}),
    ...(right ? { "--gutter-right": right } : {}),
    ...(bottom ? { "--gutter-bottom": bottom } : {}),
    ...(left ? { "--gutter-left": left } : {}),
  } as CSSProperties

  return (
    <div data-slot="page" className={cn("page-box mx-auto w-full max-w-(--page-w)", className)} style={style}>
      {children}
    </div>
  )
}

export type BleedProps = {
  readonly children: ReactNode
  /** Which side to break out of the gutter on. Default `all`. */
  readonly side?: "top" | "right" | "bottom" | "left" | "all"
  readonly className?: string
}

const BLEED_CLASS = {
  top: "bleed-top",
  right: "bleed-right",
  bottom: "bleed-bottom",
  left: "bleed-left",
  all: "bleed",
} as const

/**
 * Breaks a child out of its enclosing page/surface gutter to reach the box
 * edge. Reads the effective `--gutter-top` / `-right` / `-bottom` / `-left` the
 * box set, so the same `<Bleed>` works inside a page and inside a surface.
 */
export function Bleed({ children, side = "all", className }: BleedProps) {
  return <div className={cn(BLEED_CLASS[side], className)}>{children}</div>
}

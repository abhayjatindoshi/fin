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
  /** Override both gutter axes for this page (e.g. `--spacing(2)`). */
  readonly gutter?: string
  /** Override the horizontal gutter only. */
  readonly gutterX?: string
  /** Override the vertical gutter only. */
  readonly gutterY?: string
  readonly className?: string
}

/**
 * The standard page box: a centred, max-width column padded by the shared
 * gutter tokens (`--page-gutter-*`, responsive off `--gutter`). Children that
 * need to reach the edge use `<Bleed>`. Pages that want total control (e.g.
 * virtualized lists) can skip `<Page>` and render straight into the shell.
 *
 * The `gutter*` props set the effective `--gutter-x` / `--gutter-y` inline, so
 * both the padding here and any `<Bleed>` inside track the override.
 */
export function Page({ children, width = "md", gutter, gutterX, gutterY, className }: PageProps) {
  const gx = gutterX ?? gutter
  const gy = gutterY ?? gutter
  const style = {
    "--page-w": WIDTHS[width],
    ...(gx ? { "--gutter-x": gx } : {}),
    ...(gy ? { "--gutter-y": gy } : {}),
  } as CSSProperties

  return (
    <div data-slot="page" className={cn("page-box mx-auto w-full max-w-(--page-w)", className)} style={style}>
      {children}
    </div>
  )
}

export type BleedProps = {
  readonly children: ReactNode
  /** Which axis to break out of the gutter on. Default `both`. */
  readonly axis?: "x" | "y" | "both"
  readonly className?: string
}

/**
 * Breaks a child out of its enclosing page/surface gutter to reach the box
 * edge. Reads the effective `--gutter-x` / `--gutter-y` the box set, so the
 * same `<Bleed>` works inside a page and inside a surface.
 */
export function Bleed({ children, axis = "both", className }: BleedProps) {
  const cls = axis === "x" ? "bleed-x" : axis === "y" ? "bleed-y" : "bleed"
  return <div className={cn(cls, className)}>{children}</div>
}

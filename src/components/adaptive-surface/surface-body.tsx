import type { CSSProperties, ReactNode } from "react"
import { cn } from "@/lib/utils"

export type SurfaceBodyProps = {
  readonly children: ReactNode
  /** Override both gutter axes for this surface. */
  readonly gutter?: string
  /** Override the horizontal gutter only. */
  readonly gutterX?: string
  /** Override the vertical gutter only. */
  readonly gutterY?: string
  readonly className?: string
}

/**
 * The gutter box for overlay content — the surface counterpart to `<Page>`.
 * Applies the shared `--surface-gutter-*` tokens so overlays can carry a gutter
 * distinct from pages, while sharing one `<Bleed>` (from `@/templates/page`).
 * Passed as the `content` of an `AdaptiveSurface`.
 */
export function SurfaceBody({ children, gutter, gutterX, gutterY, className }: SurfaceBodyProps) {
  const gx = gutterX ?? gutter
  const gy = gutterY ?? gutter
  const style = {
    ...(gx ? { "--gutter-x": gx } : {}),
    ...(gy ? { "--gutter-y": gy } : {}),
  } as CSSProperties

  return (
    <div data-slot="surface-body" className={cn("surface-box", className)} style={style}>
      {children}
    </div>
  )
}

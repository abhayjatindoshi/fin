import type { ComponentProps, ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/ui/button"
import { Icon } from "@/ui/icon"
import { SurfaceHeading } from "./surface-heading"
import { SurfaceClose } from "./surface-context"
import type { SurfaceCommonProps } from "./types"

function InlineTitle({ className, children }: { readonly className?: string; readonly children?: ReactNode }) {
  return <h2 className={cn("font-heading text-base leading-none font-medium", className)}>{children}</h2>
}

function InlineDescription({ className, children }: { readonly className?: string; readonly children?: ReactNode }) {
  return <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>
}

export type InlineSurfaceContentProps = Omit<ComponentProps<"div">, "children"> & {
  /** Render the corner close button. Default `true`. */
  readonly showCloseButton?: boolean
}

export type InlineSurfaceProps = SurfaceCommonProps & {
  readonly contentProps?: InlineSurfaceContentProps
}

/**
 * A non-overlay surface: renders content inline (in normal layout flow) when
 * `open`, as a plain container. Lets `AdaptiveSurface` pair a persistent side
 * panel on one breakpoint with an overlay on another — e.g. the dev data
 * browser's desktop side panel vs. mobile bottom sheet. Ignores `trigger`
 * (an inline panel is opened by external state, not a wrapped trigger).
 */
export function InlineSurface({ open, title, description, srOnlyTitle, children, contentProps }: InlineSurfaceProps) {
  if (!open) return null
  const { showCloseButton = true, className, ...rest } = contentProps ?? {}
  return (
    <div data-slot="surface-inline" className={cn("relative", className)} {...rest}>
      <SurfaceHeading
        parts={{ Title: InlineTitle, Description: InlineDescription }}
        title={title}
        description={description}
        srOnly={srOnlyTitle}
      />
      {children}
      {showCloseButton && (
        <SurfaceClose asChild>
          <Button variant="ghost" size="icon-sm" className="absolute top-2 right-2" aria-label="Close">
            <Icon name="x" />
          </Button>
        </SurfaceClose>
      )}
    </div>
  )
}

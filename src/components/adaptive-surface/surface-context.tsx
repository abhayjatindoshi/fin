import { createContext, useContext, useMemo, type ComponentProps, type ReactNode } from "react"
import { Slot } from "radix-ui"

type SurfaceContextValue = {
  /** Close the enclosing surface (calls its `onOpenChange(false)`). */
  readonly close: () => void
}

const SurfaceContext = createContext<SurfaceContextValue | null>(null)

/** Provides the close handle to a surface's content. Set by `AdaptiveSurface`. */
export function SurfaceProvider({ close, children }: { readonly close: () => void; readonly children: ReactNode }) {
  const value = useMemo(() => ({ close }), [close])
  return <SurfaceContext.Provider value={value}>{children}</SurfaceContext.Provider>
}

/**
 * Access the enclosing surface — currently just `close()`. Lets content close
 * its own surface without depending on a specific primitive (the AdaptiveSurface
 * replacement for `SheetClose` / `DialogClose`).
 */
export function useSurface(): SurfaceContextValue {
  const ctx = useContext(SurfaceContext)
  if (!ctx) throw new Error("useSurface must be used within an AdaptiveSurface")
  return ctx
}

export type SurfaceCloseProps = ComponentProps<"button"> & {
  /** Render onto the child element (like Radix `asChild`) instead of a `<button>`. */
  readonly asChild?: boolean
}

/**
 * A button that closes the enclosing surface. Drop-in for `SheetClose` /
 * `DialogClose` but primitive-agnostic — works inside any AdaptiveSurface
 * (sheet, dialog, popover, drawer, inline). Supports `asChild`.
 */
export function SurfaceClose({ asChild, onClick, ...props }: SurfaceCloseProps) {
  const { close } = useSurface()
  const Comp = asChild ? Slot.Root : "button"
  return (
    <Comp
      {...props}
      onClick={(event) => {
        onClick?.(event)
        close()
      }}
    />
  )
}

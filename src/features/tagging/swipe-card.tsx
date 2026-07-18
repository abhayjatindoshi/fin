import { useEffect, type ReactNode } from "react"
import {
  motion,
  useMotionValue,
  useTransform,
  useReducedMotion,
  type PanInfo,
} from "motion/react"
import { Icon } from "@/ui/icon"
import { cn } from "@/lib/utils"

/** Which way a card was committed. */
export type SwipeDirection = "right" | "left"

export type SwipeCardProps = {
  readonly children: ReactNode
  /** Committed right — the "tag" intent. */
  readonly onSwipeRight: () => void
  /** Committed left — the "skip" intent. */
  readonly onSwipeLeft: () => void
  /** Disable dragging while a modal (tag picker) owns the interaction. */
  readonly dragEnabled?: boolean
  /** Whether this is the front (interactive) card; back cards render static + scaled. */
  readonly isFront: boolean
  /** Depth from the front (0 = front) — drives the peeked-stack offset/scale. */
  readonly depth: number
}

/** Past this horizontal displacement (px) a release commits the swipe. */
const COMMIT_THRESHOLD = 110
/** How far offscreen the card flies on commit. */
const FLY_OUT = 700

/**
 * Focus contexts where ←/→ belong to the focused control, not the deck: form
 * fields and the tag picker's overlay (Radix popover wrapper / bottom-sheet
 * dialog). When focus rests inside one of these, the keyboard shortcut stands
 * down so the arrow moves the caret / navigates the list instead of swiping.
 */
const INTERACTIVE_FOCUS =
  "input, textarea, select, [contenteditable='true'], [data-radix-popper-content-wrapper], [role='dialog']"

/**
 * A single draggable card in the tagging deck. Drag right past the threshold to
 * commit "tag", left to commit "skip"; a short drag springs back. Directional
 * overlays (a green tag hint / an amber skip hint) fade in with drag distance so
 * the affordance is legible before release.
 *
 * Motion:
 * - `x` motion value drives rotation + the two overlays via `useTransform`.
 * - On commit the card animates off-screen in the swipe direction, then the
 *   parent unmounts it (through `AnimatePresence`).
 * - `prefers-reduced-motion` collapses the fling to an instant resolve — the
 *   gesture still works, it just doesn't animate.
 *
 * Only the FRONT card is draggable; cards behind render as a scaled, offset peek
 * so the "stack" reads as depth without being interactive.
 */
export function SwipeCard({
  children,
  onSwipeRight,
  onSwipeLeft,
  dragEnabled = true,
  isFront,
  depth,
}: SwipeCardProps) {
  const x = useMotionValue(0)
  const reduceMotion = useReducedMotion()

  const rotate = useTransform(x, [-FLY_OUT, 0, FLY_OUT], [-14, 0, 14])
  const tagOpacity = useTransform(x, [40, COMMIT_THRESHOLD], [0, 1])
  const skipOpacity = useTransform(x, [-COMMIT_THRESHOLD, -40], [1, 0])

  const commit = (dir: SwipeDirection) => {
    if (dir === "right") onSwipeRight()
    else onSwipeLeft()
  }

  const handleDragEnd = (_e: unknown, info: PanInfo) => {
    // Commit on distance OR a fast flick (velocity) past a lighter distance.
    const past = Math.abs(info.offset.x) > COMMIT_THRESHOLD
    const flick = Math.abs(info.velocity.x) > 500 && Math.abs(info.offset.x) > 40
    if (!past && !flick) return // spring back (framer resets x to 0)
    commit(info.offset.x > 0 ? "right" : "left")
  }

  // Keyboard affordance (desktop): ←/→ resolve the FRONT card without a mouse
  // drag. Registered only for the front card so background cards stay inert.
  useEffect(() => {
    if (!isFront || !dragEnabled) return
    const onKey = (e: KeyboardEvent) => {
      // Don't hijack arrows aimed at a focused field or the open tag picker —
      // there they move the caret / navigate the list, not swipe the card.
      const active = document.activeElement
      if (active?.closest(INTERACTIVE_FOCUS)) return
      if (e.key === "ArrowRight") { e.preventDefault(); commit("right") }
      else if (e.key === "ArrowLeft") { e.preventDefault(); commit("left") }
    }
    window.addEventListener("keydown", onKey)
    return () => { window.removeEventListener("keydown", onKey) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFront, dragEnabled])

  // Background cards: a static, scaled, downward-offset peek — no drag, no x.
  if (!isFront) {
    return (
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 origin-top"
        style={{
          transform: `translateY(${depth * 12}px) scale(${1 - depth * 0.04})`,
          zIndex: 10 - depth,
          opacity: depth > 2 ? 0 : 1,
        }}
      >
        {children}
      </div>
    )
  }

  return (
    <motion.div
      className="absolute inset-x-0 top-0 touch-none"
      style={{ x, rotate, zIndex: 20 }}
      drag={dragEnabled ? "x" : false}
      dragSnapToOrigin
      dragElastic={0.5}
      onDragEnd={handleDragEnd}
      whileTap={{ cursor: "grabbing" }}
      initial={reduceMotion ? false : { scale: 0.96, opacity: 0.6 }}
      animate={{ scale: 1, opacity: 1, x: 0 }}
      exit={
        reduceMotion
          ? { opacity: 0, transition: { duration: 0 } }
          : {
              x: x.get() >= 0 ? FLY_OUT : -FLY_OUT,
              opacity: 0,
              transition: { duration: 0.28, ease: "easeOut" },
            }
      }
    >
      {/* Directional intent overlays — legible before release. */}
      <motion.div
        style={{ opacity: tagOpacity }}
        className="pointer-events-none absolute left-4 top-4 z-30 flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1 text-sm font-semibold text-white shadow-lg"
      >
        <Icon name="tag" className="size-4" /> Tag
      </motion.div>
      <motion.div
        style={{ opacity: skipOpacity }}
        className="pointer-events-none absolute right-4 top-4 z-30 flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-sm font-semibold text-white shadow-lg"
      >
        Skip <Icon name="chevron-right" className="size-4" />
      </motion.div>

      <div className={cn("cursor-grab active:cursor-grabbing")}>{children}</div>
    </motion.div>
  )
}

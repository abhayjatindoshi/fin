/**
 * Pure state machine for the tagging-cards deck. No React, no store, no motion —
 * just the reducer that drives the card stack, so every rule (ordering, undo,
 * auto-advance past already-handled similars, done-detection) is unit-testable
 * in isolation. The container binds this to the services + swipe gestures.
 *
 * Design intent (see the tagging-cards feature):
 * - The queue is SNAPSHOT on entry: tagging a card must not reshuffle the deck
 *   under the user (§ "don't reshuffle mid-session"). New untagged rows that
 *   arrive mid-session are ignored until the next entry.
 * - When a card is tagged and its similar look-alikes are bulk-tagged too, those
 *   sibling cards are REMOVED from the remaining queue (they're already handled)
 *   — they leave as "done for you", the count doesn't strand on them.
 * - Skips are non-destructive: a skipped card is simply passed, never written.
 * - Every action pushes onto an undo stack so the last swipe can be taken back.
 */

/** How a card left the deck — drives the undo semantics + the tally. */
export type SwipeKind = "tagged" | "skipped"

/** One resolved card, retained so it can be undone. */
export type DeckHistoryEntry = {
  readonly txId: string
  readonly kind: SwipeKind
  /** Tag applied (tagged only) — for the undo tooltip + re-tag on undo. */
  readonly tagId?: string
  /** Sibling ids bulk-tagged alongside this card (tagged + apply-all only). */
  readonly appliedToSimilar: readonly string[]
  /** Cursor position this card occupied — where undo restores to. */
  readonly index: number
}

export type DeckState = {
  /** The snapshot queue of untagged tx ids, in entry order. Immutable per session. */
  readonly queue: readonly string[]
  /** Ids removed from the remaining run because a prior card bulk-tagged them. */
  readonly consumed: ReadonlySet<string>
  /** Index into `queue` of the current card (may point at a consumed id — skipped). */
  readonly cursor: number
  /** Resolved cards, most-recent-last. Powers undo + the completion tally. */
  readonly history: readonly DeckHistoryEntry[]
}

export type DeckAction =
  | { type: "init"; txIds: readonly string[] }
  | { type: "tag"; txId: string; tagId: string; appliedToSimilar: readonly string[] }
  | { type: "skip"; txId: string }
  | { type: "undo" }

/** The card the cursor currently rests on, or `undefined` when the deck is done. */
export function currentCard(state: DeckState): string | undefined {
  return state.queue[state.cursor]
}

/** How many cards remain to resolve (current + not-yet-reached, minus consumed). */
export function remainingCount(state: DeckState): number {
  let n = 0
  for (let i = state.cursor; i < state.queue.length; i++) {
    const id = state.queue[i]
    if (!state.consumed.has(id)) n += 1
  }
  return n
}

/** Total cards the user actively resolved (tagged or skipped) — the tally. */
export function resolvedCount(state: DeckState): number {
  return state.history.length
}

/** How many transactions were tagged in total, counting bulk-applied siblings. */
export function taggedTotal(state: DeckState): number {
  let n = 0
  for (const h of state.history) {
    if (h.kind === "tagged") n += 1 + h.appliedToSimilar.length
  }
  return n
}

/** True once every card in the snapshot has been resolved or consumed. */
export function isDone(state: DeckState): boolean {
  return currentCard(state) === undefined
}

export const EMPTY_DECK: DeckState = {
  queue: [],
  consumed: new Set(),
  cursor: 0,
  history: [],
}

/**
 * Advances the cursor to the next card that hasn't been consumed by a prior
 * bulk-tag. A consumed id under the cursor is silently stepped over — it was
 * already tagged as a sibling, so it must not be shown again.
 */
function nextLiveCursor(queue: readonly string[], consumed: ReadonlySet<string>, from: number): number {
  let i = from
  while (i < queue.length && consumed.has(queue[i])) i += 1
  return i
}

export function deckReducer(state: DeckState, action: DeckAction): DeckState {
  switch (action.type) {
    case "init": {
      // De-dupe while preserving order — the snapshot is the run for this session.
      const seen = new Set<string>()
      const queue: string[] = []
      for (const id of action.txIds) {
        if (!seen.has(id)) { seen.add(id); queue.push(id) }
      }
      const consumed = new Set<string>()
      return { queue, consumed, cursor: nextLiveCursor(queue, consumed, 0), history: [] }
    }

    case "tag": {
      const entry: DeckHistoryEntry = {
        txId: action.txId,
        kind: "tagged",
        tagId: action.tagId,
        appliedToSimilar: action.appliedToSimilar,
        index: state.cursor,
      }
      // Mark the bulk-tagged siblings consumed so their cards don't resurface.
      const consumed = new Set(state.consumed)
      for (const id of action.appliedToSimilar) consumed.add(id)
      const cursor = nextLiveCursor(state.queue, consumed, state.cursor + 1)
      return { ...state, consumed, cursor, history: [...state.history, entry] }
    }

    case "skip": {
      const entry: DeckHistoryEntry = {
        txId: action.txId,
        kind: "skipped",
        appliedToSimilar: [],
        index: state.cursor,
      }
      const cursor = nextLiveCursor(state.queue, state.consumed, state.cursor + 1)
      return { ...state, cursor, history: [...state.history, entry] }
    }

    case "undo": {
      if (state.history.length === 0) return state
      const last = state.history[state.history.length - 1]
      // Un-consume any siblings this card had bulk-tagged, and rewind the cursor
      // to the card's original slot so it is shown again for re-decision.
      const consumed = new Set(state.consumed)
      for (const id of last.appliedToSimilar) consumed.delete(id)
      return {
        ...state,
        consumed,
        cursor: last.index,
        history: state.history.slice(0, -1),
      }
    }
  }
}

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react"
import { AnimatePresence } from "motion/react"
import { toast } from "sonner"
import { Icon } from "@/ui/icon"
import { Button } from "@/ui/button"
import { useObservable } from "@/providers/use-observable"
import { useServices } from "@/providers/services-provider"
import { useTransactionsQuery } from "@/features/transactions/hooks/use-transactions-query"
import type { TagView } from "@/views/tag-view"
import type { TransactionRow } from "@/entities/transaction"
import {
  deckReducer,
  currentCard,
  remainingCount,
  taggedTotal,
  resolvedCount,
  isDone,
  EMPTY_DECK,
} from "./deck-reducer"
import { SwipeCard } from "./swipe-card"
import { TagCard, type SimilarPreview } from "./tag-card"
import { TaggingDone, TaggingEmpty } from "./tagging-states"

/** How many look-alike rows to show in the collapsible peek. */
const PEEK_SAMPLE = 4
/** Cards rendered behind the front one, for the stacked-depth look. */
const VISIBLE_STACK = 3

/**
 * The tagging deck — the stacked-card inbox for untagged transactions.
 *
 * Flow per card: pick a tag → confirm (with the pre-checked "apply to all N
 * similar" opt-out) → the card swipes right and the pick is applied; or swipe
 * left to skip. Undo takes back the last swipe. When the snapshot is cleared, a
 * done state tallies the work; an all-clear inbox shows the empty state.
 *
 * The untagged set is SNAPSHOT once per entry (via the reducer's `init`) so
 * tagging never reshuffles the deck under the user. Rows that a bulk-tag already
 * handled are consumed from the run so their cards never resurface.
 */
export function TaggingDeck() {
  const { transactions: svc, accounts: accountsSvc } = useServices()
  const { transactions, loading } = useTransactionsQuery()
  const accounts = useObservable(accountsSvc.accounts$)

  const [state, dispatch] = useReducer(deckReducer, EMPTY_DECK)
  const snapshotTaken = useRef(false)

  // Per-card pick state (the chosen tag + apply-to-all + resolved preview).
  const [pickedTag, setPickedTag] = useState<TagView | null>(null)
  const [applyToAll, setApplyToAll] = useState(true)

  // Index transactions by id for O(1) card lookup against the snapshot queue.
  const txById = useMemo(
    () => new Map(transactions.map((t) => [t.id, t])),
    [transactions],
  )
  const accountById = useMemo(
    () => new Map(accounts.map((a) => [a.id, a])),
    [accounts],
  )

  // Snapshot the untagged set ONCE, when the year's transactions first load.
  // Re-entry (navigating away and back) remounts this component → fresh snapshot.
  // A ref (not state) tracks that the snapshot was taken, so there's no
  // companion setState cascading a render inside the effect.
  useEffect(() => {
    if (snapshotTaken.current || loading) return
    const untagged = transactions.filter((t) => t.tagId === undefined).map((t) => t.id)
    dispatch({ type: "init", txIds: untagged })
    snapshotTaken.current = true
  }, [loading, transactions])

  const currentId = currentCard(state)
  const currentTx = currentId ? txById.get(currentId) : undefined

  // Resolve the similar-preview for the CURRENT card's picked tag. Uses the
  // service preview so the count is exactly what tagMany would apply.
  const similar: SimilarPreview | undefined = useMemo(() => {
    if (!currentId || !currentTx || pickedTag === null) return undefined
    const fact = svc.previewSimilar(currentId, pickedTag.id)
    if (!fact || fact.transactionIds.length === 0) return undefined
    const sample = fact.transactionIds
      .slice(0, PEEK_SAMPLE)
      .map((id) => txById.get(id))
      .filter((t): t is TransactionRow => t !== undefined)
    return { count: fact.transactionIds.length, sample }
  }, [currentId, currentTx, pickedTag, svc, txById])

  const resetPick = useCallback(() => {
    setPickedTag(null)
    setApplyToAll(true)
  }, [])

  // Commit the picked tag: tag the card, optionally bulk-tag its look-alikes,
  // then advance the deck (recording which siblings were consumed for undo).
  const confirmTag = useCallback(() => {
    if (!currentId || pickedTag === null) return
    const { similar: fact } = svc.tag(currentId, pickedTag.id)
    const applied: string[] = []
    if (applyToAll && fact && fact.transactionIds.length > 0) {
      svc.tagMany(fact.transactionIds, fact.tagId)
      applied.push(...fact.transactionIds)
    }
    dispatch({ type: "tag", txId: currentId, tagId: pickedTag.id, appliedToSimilar: applied })
    resetPick()
  }, [currentId, pickedTag, applyToAll, svc, resetPick])

  const skip = useCallback(() => {
    if (!currentId) return
    dispatch({ type: "skip", txId: currentId })
    resetPick()
  }, [currentId, resetPick])

  // Undo the last swipe: re-clear the tag if it was a tag (and un-bulk its
  // siblings), rewind the deck, and drop back onto that card.
  const undo = useCallback(() => {
    if (state.history.length === 0) return
    const last = state.history[state.history.length - 1]
    if (last.kind === "tagged") {
      svc.untag(last.txId)
      for (const id of last.appliedToSimilar) svc.untag(id)
    }
    dispatch({ type: "undo" })
    resetPick()
  }, [state.history, svc, resetPick])

  // Swipe-right requires a chosen tag; if none is picked yet, a right-swipe
  // shouldn't tag blindly — nudge the user to pick first. Skip (left) is free.
  const onSwipeRight = useCallback(() => {
    if (pickedTag === null) {
      toast("Pick a tag first, then swipe right to apply.")
      return
    }
    confirmTag()
  }, [pickedTag, confirmTag])

  // While the year's transactions are still hydrating, hold the spinner. Once
  // loaded, the init effect has run (it dispatches synchronously on the same
  // load) so the deck reflects the real snapshot, not the empty initial state.
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Icon name="refresh-cw" className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isDone(state)) {
    // Distinguish "never had any" (empty inbox) from "just cleared them" (done).
    return resolvedCount(state) === 0 ? (
      <TaggingEmpty />
    ) : (
      <TaggingDone tagged={taggedTotal(state)} resolved={resolvedCount(state)} />
    )
  }

  const remaining = remainingCount(state)

  // The peeked stack: the front card + the next few, rendered back-to-front.
  const stackIds: string[] = []
  for (let i = state.cursor; i < state.queue.length && stackIds.length < VISIBLE_STACK; i++) {
    const id = state.queue[i]
    if (!state.consumed.has(id)) stackIds.push(id)
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 p-4">
      {/* Progress + undo. */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icon name="inbox" className="size-4" />
          <span>{remaining} to tag</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          disabled={state.history.length === 0}
          onClick={undo}
        >
          <Icon name="undo-2" className="size-4" /> Undo
        </Button>
      </div>

      {/* The card stack. Fixed-height positioning context; cards are absolute. */}
      <div className="relative min-h-120">
        <AnimatePresence initial={false}>
          {stackIds
            .map((id, depth) => {
              const tx = txById.get(id)
              if (!tx) return null
              const isFront = depth === 0
              return (
                <SwipeCard
                  key={id}
                  isFront={isFront}
                  depth={depth}
                  dragEnabled={isFront}
                  onSwipeRight={onSwipeRight}
                  onSwipeLeft={skip}
                >
                  <TagCard
                    tx={tx}
                    account={accountById.get(tx.accountId)}
                    pickedTag={isFront ? pickedTag : null}
                    onPick={setPickedTag}
                    similar={isFront ? similar : undefined}
                    applyToAll={applyToAll}
                    onApplyToAllChange={setApplyToAll}
                    onConfirm={confirmTag}
                    onClearPick={resetPick}
                  />
                </SwipeCard>
              )
            })
            // Render back-to-front so the front card paints last (on top).
            .reverse()}
        </AnimatePresence>
      </div>

      {/* Explicit buttons — the accessible, non-gesture path (desktop + a11y). */}
      <div className="flex items-center justify-center gap-3">
        <Button variant="outline" size="lg" onClick={skip} className="flex-1">
          <Icon name="chevron-left" className="size-4" /> Skip
        </Button>
        <Button
          size="lg"
          onClick={onSwipeRight}
          disabled={pickedTag === null}
          className="flex-1"
        >
          <Icon name="tag" className="size-4" /> Tag
        </Button>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Swipe or use ← → keys. Pick a tag before tagging.
      </p>
    </div>
  )
}

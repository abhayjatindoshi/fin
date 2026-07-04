import { describe, it, expect } from "vitest"
import {
  deckReducer,
  currentCard,
  remainingCount,
  resolvedCount,
  taggedTotal,
  isDone,
  EMPTY_DECK,
  type DeckState,
} from "@/features/tagging/deck-reducer"

/**
 * The pure state machine behind the tagging deck. Pins the load-bearing rules:
 * snapshot-on-init (no reshuffle), sibling consumption on bulk-tag, undo that
 * un-consumes + rewinds, and done-detection. No React, no store — just the
 * reducer, exercised through its action union.
 */

/** Build a deck from a list of tx ids (via the reducer's own init). */
function deckOf(ids: readonly string[]): DeckState {
  return deckReducer(EMPTY_DECK, { type: "init", txIds: ids })
}

describe("deckReducer / init", () => {
  it("snapshots the queue in order and points at the first card", () => {
    const state = deckOf(["a", "b", "c"])
    expect(state.queue).toEqual(["a", "b", "c"])
    expect(currentCard(state)).toBe("a")
    expect(remainingCount(state)).toBe(3)
    expect(isDone(state)).toBe(false)
  })

  it("de-dupes ids while preserving first-seen order", () => {
    const state = deckOf(["a", "b", "a", "c", "b"])
    expect(state.queue).toEqual(["a", "b", "c"])
  })

  it("an empty snapshot is immediately done", () => {
    const state = deckOf([])
    expect(currentCard(state)).toBeUndefined()
    expect(isDone(state)).toBe(true)
    expect(remainingCount(state)).toBe(0)
  })
})

describe("deckReducer / skip", () => {
  it("advances to the next card without consuming anything", () => {
    let state = deckOf(["a", "b"])
    state = deckReducer(state, { type: "skip", txId: "a" })
    expect(currentCard(state)).toBe("b")
    expect(remainingCount(state)).toBe(1)
    expect(resolvedCount(state)).toBe(1)
    expect(taggedTotal(state)).toBe(0) // a skip tags nothing
  })
})

describe("deckReducer / tag", () => {
  it("advances and records the tag; taggedTotal counts just the card", () => {
    let state = deckOf(["a", "b"])
    state = deckReducer(state, { type: "tag", txId: "a", tagId: "t1", appliedToSimilar: [] })
    expect(currentCard(state)).toBe("b")
    expect(taggedTotal(state)).toBe(1)
  })

  it("consumes bulk-tagged siblings so their cards never resurface", () => {
    // Deck a,b,c,d. Tagging a bulk-tags c → c is consumed; cursor skips it.
    let state = deckOf(["a", "b", "c", "d"])
    state = deckReducer(state, { type: "tag", txId: "a", tagId: "t1", appliedToSimilar: ["c"] })
    expect(currentCard(state)).toBe("b")
    expect(state.consumed.has("c")).toBe(true)
    // remaining = b + d (c consumed, a resolved) = 2
    expect(remainingCount(state)).toBe(2)
    // taggedTotal counts the card + its 1 sibling = 2
    expect(taggedTotal(state)).toBe(2)

    // Skipping b lands on d — c is stepped over entirely.
    state = deckReducer(state, { type: "skip", txId: "b" })
    expect(currentCard(state)).toBe("d")
  })

  it("steps over a consumed card that sits directly under the cursor", () => {
    // Tagging a consumes b (the very next card) → cursor jumps past b to c.
    let state = deckOf(["a", "b", "c"])
    state = deckReducer(state, { type: "tag", txId: "a", tagId: "t1", appliedToSimilar: ["b"] })
    expect(currentCard(state)).toBe("c")
  })

  it("reaches done when the last card is tagged", () => {
    let state = deckOf(["a"])
    state = deckReducer(state, { type: "tag", txId: "a", tagId: "t1", appliedToSimilar: [] })
    expect(isDone(state)).toBe(true)
    expect(taggedTotal(state)).toBe(1)
  })
})

describe("deckReducer / undo", () => {
  it("is a no-op on an untouched deck", () => {
    const state = deckOf(["a", "b"])
    expect(deckReducer(state, { type: "undo" })).toBe(state)
  })

  it("takes back a skip and returns to that card", () => {
    let state = deckOf(["a", "b"])
    state = deckReducer(state, { type: "skip", txId: "a" })
    expect(currentCard(state)).toBe("b")
    state = deckReducer(state, { type: "undo" })
    expect(currentCard(state)).toBe("a")
    expect(resolvedCount(state)).toBe(0)
  })

  it("takes back a tag, un-consuming its bulk-tagged siblings", () => {
    let state = deckOf(["a", "b", "c"])
    state = deckReducer(state, { type: "tag", txId: "a", tagId: "t1", appliedToSimilar: ["c"] })
    expect(state.consumed.has("c")).toBe(true)
    expect(currentCard(state)).toBe("b")

    state = deckReducer(state, { type: "undo" })
    expect(currentCard(state), "rewinds to the tagged card").toBe("a")
    expect(state.consumed.has("c"), "sibling is released").toBe(false)
    expect(remainingCount(state)).toBe(3)
    expect(taggedTotal(state)).toBe(0)
  })

  it("undoes from a done state back to the last card", () => {
    let state = deckOf(["a"])
    state = deckReducer(state, { type: "tag", txId: "a", tagId: "t1", appliedToSimilar: [] })
    expect(isDone(state)).toBe(true)
    state = deckReducer(state, { type: "undo" })
    expect(isDone(state)).toBe(false)
    expect(currentCard(state)).toBe("a")
  })
})

describe("tally helpers", () => {
  it("taggedTotal sums cards plus their bulk-applied siblings across history", () => {
    let state = deckOf(["a", "b", "c", "d", "e"])
    state = deckReducer(state, { type: "tag", txId: "a", tagId: "t1", appliedToSimilar: ["b", "c"] })
    // cursor now at d (b, c consumed). Tag d alone.
    state = deckReducer(state, { type: "tag", txId: "d", tagId: "t2", appliedToSimilar: [] })
    // a(+2) + d(+0) card-wise = 3 cards tagged, +2 siblings = 5 total
    expect(taggedTotal(state)).toBe(4) // a=1+2 siblings=3, d=1 → 4
    expect(resolvedCount(state)).toBe(2) // two cards actively resolved
  })
})

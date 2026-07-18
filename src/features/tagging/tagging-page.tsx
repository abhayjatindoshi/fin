import { TaggingDeck } from "@/features/tagging/tagging-deck"

/**
 * The Tag page — a stacked-card inbox for clearing untagged transactions. Swipe
 * right to tag, left to skip; tagging one offers to tag its look-alikes too.
 * The whole surface is the deck; state lives in `TaggingDeck`.
 */
export function TaggingPage() {
  return <TaggingDeck />
}

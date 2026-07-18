/** Tagged/untagged constraint, or `null` for "no tag filter". */
export type TagFilter = "tagged" | "untagged" | null

/**
 * Compound, unnamed transaction filter. Persisted per tenant to
 * `sessionStorage`. Amount bounds are **major units** in the tenant's default
 * currency and compared on the absolute value.
 */
export type TransactionFilter = {
  readonly sort: "asc" | "desc"
  readonly accountIds: readonly string[]   // empty = all
  readonly tag: TagFilter
  /** Single selected tag; `undefined` = all tags. Selecting a parent tag also
   *  matches its children (expanded from the live tag tree at filter time).
   *  Mutually exclusive with `tag` — picking a specific tag clears the toggle. */
  readonly tagId?: string
  readonly amountMin?: number              // major units
  readonly amountMax?: number              // major units
  readonly search: string                  // narration/title/tag-name substring OR exact amount
}

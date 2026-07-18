import type { FilterState } from "./filter-state"

/**
 * The shared contract every transaction filter control implements: the filter
 * read/write surface. Each control reads and writes its own slice via
 * `state.filter` / `state.patch`. Controls always render inside the filter
 * surface (popover on desktop, sheet on mobile).
 */
export type FilterControlProps = {
  readonly state: FilterState
  readonly className?: string
}

import { useState } from "react"
import { Button } from "@/ui/button"
import { Icon } from "@/ui/icon"
import { tagIconName } from "@/catalog/icon-resolve"
import { cn } from "@/lib/utils"
import { useObservable } from "@/providers/use-observable"
import { useServices } from "@/providers/services-provider"
import type { TagView } from "@/views/tag-view"
import { TagPicker } from "./tag-picker"
import type { FilterControlProps } from "../types"

/**
 * Single-select tag filter. Reuses the hierarchical `TagPicker`; selecting a
 * parent tag also matches its children (expansion happens in the filter hook).
 * Picking a tag clears the Tagged/Untagged toggle — the two are mutually
 * exclusive. `undefined` selection = all tags.
 */
export function TagSelect({ state, className }: FilterControlProps) {
  const { filter, patch } = state
  const selectedId = filter.tagId
  const [open, setOpen] = useState(false)
  const tags = useObservable(useServices().tags.displayTags$)
  const selected = selectedId ? tags.find((t) => t.id === selectedId) : undefined

  const onSelect = (tag: TagView | null) => {
    patch(tag ? { tagId: tag.id, tag: null } : { tagId: undefined })
  }

  return (
    <TagPicker
      open={open}
      onOpenChange={setOpen}
      selectedTagId={selectedId ?? null}
      onSelect={onSelect}
    >
      <Button
        variant="ghost"
        className={cn("pill px-3", "w-full justify-start font-light", className)}
      >
        <Icon
          name={selected ? tagIconName(selected) : "hash"}
          className={cn(!selected && "text-muted-foreground")}
        />
        <span className="truncate">{selected ? selected.name : "All tags"}</span>
        <Icon name="chevron-down" className="text-muted-foreground" />
      </Button>
    </TagPicker>
  )
}

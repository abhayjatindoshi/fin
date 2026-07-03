import { Icon } from "@/ui/icon"

/**
 * The completion state — shown when the user has cleared the whole snapshot.
 * A tally of what they accomplished (the dopamine that makes people come back),
 * distinct from the never-had-any empty state below.
 */
export function TaggingDone({ tagged, resolved }: { readonly tagged: number; readonly resolved: number }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-emerald-500/15">
        <Icon name="party-popper" className="size-10 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold">Well done!</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {tagged > 0 ? (
            <>
              You tagged <span className="font-medium text-foreground">{tagged}</span>{" "}
              {tagged === 1 ? "transaction" : "transactions"}
              {resolved > 0 && ` across ${resolved} ${resolved === 1 ? "card" : "cards"}`}.
            </>
          ) : (
            <>You cleared your tagging inbox.</>
          )}
        </p>
      </div>
      <p className="text-sm text-muted-foreground">Inbox zero. Nothing left to tag. 🎉</p>
    </div>
  )
}

/**
 * The empty state — no untagged transactions at all (a fresh import, or already
 * all tagged). Different copy from the done state: nothing was accomplished this
 * session, there was simply nothing to do.
 */
export function TaggingEmpty() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <Icon name="inbox" className="size-10 text-muted-foreground" />
      <div>
        <h1 className="text-xl font-semibold">Nothing to tag</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every transaction this year is tagged. Import a statement to bring in more.
        </p>
      </div>
    </div>
  )
}

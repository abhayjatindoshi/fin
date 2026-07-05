import { useState } from "react"
import { AdaptiveSurface } from "@/components/adaptive-surface"
import { Button } from "@/ui/button"
import { Icon } from "@/ui/icon"
import { Pill } from "@/ui/pill"
import { cn } from "@/lib/utils"
import { useServices } from "@/providers/services-provider"
import { useObservable } from "@/providers/use-observable"
import { runNotificationAction } from "@/providers/notification-actions"
import { resolveDisplay } from "@/services/notifications"

type NotificationsSheetProps = {
  readonly className?: string
  /** Render a plain icon trigger (for embedding as a nav-bar item) instead of a glass pill. */
  readonly bare?: boolean
}

/**
 * The notifications inbox surface — the durable notification list with
 * mark-all-read. Opened by a bell pill (desktop bar) or a bare bell item
 * (mobile nav). The unread badge lives on the bell. Popover on desktop, bottom
 * sheet on mobile.
 */
export function NotificationsSheet({ className, bare = false }: NotificationsSheetProps) {
  const [open, setOpen] = useState(false)
  const { notifications: svc } = useServices()
  const items = useObservable(svc.notifications$)
  const unread = useObservable(svc.unreadCount$)

  const badge = unread > 0 && (
    <span
      className={cn(
        "absolute inline-flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-white tabular-nums",
        bare ? "-right-1.5 -top-1.5" : "right-0.5 top-0.5",
      )}
    >
      {unread}
    </span>
  )

  const trigger = bare ? (
    <button type="button" aria-label="Notifications" className="relative z-10 flex items-center">
      <Icon name="bell" className="size-4" />
      {badge}
    </button>
  ) : (
    <Pill asChild variant="icon" interactive className={className}>
      <button type="button" aria-label="Notifications">
        <Icon name="bell" className="size-4 text-muted-foreground" />
        {badge}
      </button>
    </Pill>
  )

  return (
    <AdaptiveSurface
      open={open}
      onOpenChange={setOpen}
      title="Notifications"
      srOnlyTitle
      trigger={trigger}
      content={
        <div className="flex flex-col">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-sm font-medium">Notifications</span>
            {unread > 0 && (
              <Button variant="ghost" size="sm" onClick={() => { svc.markAllRead() }}>
                <Icon name="check-check" className="size-4" />
                Mark all read
              </Button>
            )}
          </div>
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <Icon name="bell" className="size-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">You're all caught up</span>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {items.map((n) => {
                const display = resolveDisplay(n.display)
                return (
                  <div
                    key={n.id}
                    role="button"
                    tabIndex={0}
                    className={cn(
                      "flex cursor-pointer items-start gap-2 px-3 py-2 transition-colors hover:bg-muted",
                      !n.read && "bg-muted/40",
                    )}
                    onClick={() => { runNotificationAction(n.ref); svc.markRead(n.id) }}
                  >
                    <Icon name={display.icon} className={cn("mt-0.5 size-4 shrink-0", display.color)} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{n.title}</div>
                      {n.body && <div className="truncate text-xs text-muted-foreground">{n.body}</div>}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0"
                      aria-label="Dismiss"
                      onClick={(e) => { e.stopPropagation(); svc.dismiss(n.id) }}
                    >
                      <Icon name="x" className="size-3" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      }
      desktop={{ type: "popover", props: { surface: "glass" } }}
      mobile={{ type: "sheet", props: { side: "bottom", surface: "glass", showCloseButton: false } }}
    />
  )
}

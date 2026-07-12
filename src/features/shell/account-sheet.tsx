import { useState } from "react"
import { useNavigate, useParams } from "react-router"
import { useAuthActions, useTenant } from "@fyre-db/plugins-ui"
import { AdaptiveSurface } from "@/components/adaptive-surface"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { Avatar, AvatarFallback } from "@/ui/avatar"
import { Icon } from "@/ui/icon"
import { cn } from "@/lib/utils"
import { getInitials } from "@/lib/text"
import { getColor } from "@/lib/colors"
import { useApp } from "@/providers/app-provider"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/ui/dropdown-menu"
import { YearPill } from "@/features/shell/year-pill"
import { useSyncStatus, syncIcon } from "@/features/shell/sync-status"

type ActionProps = {
  readonly icon: string
  readonly label: string
  readonly onClick: () => void
  readonly spin?: boolean
}

function Action({ icon, label, onClick, spin = false }: ActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 rounded-lg px-2 py-2 text-xs transition-colors hover:bg-muted"
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-muted text-foreground">
        <Icon name={icon} className={cn("size-4", spin && "animate-spin")} />
      </span>
      <span>{label}</span>
    </button>
  )
}

function HouseholdPicker({ onNavigate }: { readonly onNavigate: () => void }) {
  const navigate = useNavigate()
  const { tenantId } = useParams()
  const { all, active } = useTenant()
  const current = active ?? all.find((t) => t.id === tenantId)
  const switchTo = (id: string) => {
    if (id && id !== tenantId) { onNavigate(); void navigate(`/t/${id}`) }
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn("pill cursor-pointer px-3", "min-w-0 flex-1 justify-start")}
        >
          <Icon name="home" className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{current?.name ?? "Household"}</span>
          <Icon name="chevron-down" className="ml-auto size-4 shrink-0 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-56">
        {all.map((t) => (
          <DropdownMenuCheckboxItem
            key={t.id}
            checked={current?.id === t.id}
            onClick={() => { switchTo(t.id) }}
          >
            {t.name}
          </DropdownMenuCheckboxItem>
        ))}
        {all.length > 0 && <DropdownMenuSeparator />}
        <DropdownMenuItem onClick={() => { onNavigate(); void navigate("/tenants") }}>
          <Icon name="bolt" className="size-4" />
          Manage
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

type AccountSheetProps = {
  readonly className?: string
  /** Render a plain icon trigger (for embedding as a nav-bar item) instead of a glass pill. */
  readonly bare?: boolean
}

/**
 * The account surface — profile identity header, a quick-action row, and the
 * household / year / theme / sync controls. Opened by an avatar pill (desktop
 * bar) or a bare avatar item (mobile nav). Popover on desktop, bottom sheet on
 * mobile.
 */
export function AccountSheet({ className, bare = false }: AccountSheetProps) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { tenantId } = useParams()
  const { signOut } = useAuthActions()
  const { devMode } = useApp()
  const sync = useSyncStatus()
  const syncGlyph = syncIcon(sync)

  // No user identity in the session yet — placeholders for now.
  const userName = "Your Name"
  const userEmail = "you@example.com"
  const color = getColor(userName)

  const go = (path: string) => { setOpen(false); void navigate(path) }
  const close = () => { setOpen(false) }

  const trigger = bare ? (
    <button type="button" aria-label="Account menu" className="relative z-10 flex items-center">
      <Icon name="user" className="size-4" />
    </button>
  ) : (
    <button
      type="button"
      aria-label="Account menu"
      className={cn("pill glass aspect-square cursor-pointer p-0", className)}
    >
      <Icon name="user" className="size-4 text-muted-foreground" />
    </button>
  )

  return (
    <AdaptiveSurface
      open={open}
      onOpenChange={setOpen}
      title="Account"
      srOnlyTitle
      trigger={trigger}
      content={
        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-center gap-3">
            <Avatar size="lg">
              <AvatarFallback className={cn(color.bg, color.text, color.darkText)}>
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{userName}</div>
              <div className="truncate text-xs text-muted-foreground">{userEmail}</div>
            </div>
            <button
              type="button"
              aria-label="Log out"
              onClick={() => { close(); void signOut() }}
              className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-destructive"
            >
              <Icon name="log-out" className="size-4" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 border-y py-3">
            <span className="text-sm font-medium">Theme</span>
            <ThemeSwitcher />
          </div>

          <div className="flex justify-center gap-2">
            <Action icon={syncGlyph.name} spin={syncGlyph.spin} label="Sync" onClick={sync.saveChanges} />
            <Action icon="settings" label="Settings" onClick={() => { go(`/t/${tenantId}/settings`) }} />
            {devMode && (
              <Action icon="terminal" label="Dev" onClick={() => { go(`/t/${tenantId}/dev`) }} />
            )}
          </div>

          <div className="flex gap-2">
            <HouseholdPicker onNavigate={close} />
            <YearPill className="flex-1" />
          </div>
        </div>
      }
      desktop={{ type: "popover", props: { className: "w-auto min-w-[350px]", surface: "glass" } }}
      mobile={{
        type: "sheet",
        props: {
          side: "bottom",
          variant: "floating",
          surface: "glass",
          showCloseButton: false,
        },
      }}
    />
  )
}

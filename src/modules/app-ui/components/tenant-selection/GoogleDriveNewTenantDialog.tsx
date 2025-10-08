import type { Folder, Space } from '@/modules/app/services/cloud/types'
import { Button } from '@/modules/base-ui/components/ui/button'
import { Checkbox } from '@/modules/base-ui/components/ui/checkbox'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/modules/base-ui/components/ui/dialog'
import { Input } from '@/modules/base-ui/components/ui/input'
import React from 'react'
import { GoogleDriveFolderSelectionDialog } from './GoogleDriveFolderSelectionDialog'

export interface GoogleDriveNewTenantDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onCreate?: (data: { name: string; shareable: boolean; folder?: Folder }) => Promise<void> | void
    defaultShareable?: boolean
    title?: string
    description?: string
    folderDialogTitle?: string
    folderDialogDescription?: string
}

export const GoogleDriveNewTenantDialog: React.FC<GoogleDriveNewTenantDialogProps> = ({
    open,
    onOpenChange,
    onCreate,
    defaultShareable = false,
    title = 'Create Household',
    description = 'A household groups accounts, transactions and budgets. You can optionally share it with others by enabling sharing.',
    folderDialogTitle = 'Select Shared Folder',
    folderDialogDescription = 'Choose a Google Drive folder that collaborators will have access to.',
}) => {
    const [name, setName] = React.useState('')
    const [shareable, setShareable] = React.useState(defaultShareable)
    const [folder, setFolder] = React.useState<Folder | undefined>()
    const [submitting, setSubmitting] = React.useState(false)
    const [touched, setTouched] = React.useState(false)
    const [folderPickerOpen, setFolderPickerOpen] = React.useState(false)

    // Reset form when dialog closes
    React.useEffect(() => {
        if (!open) {
            setName('')
            setShareable(defaultShareable)
            setFolder(undefined)
            setSubmitting(false)
            setTouched(false)
        }
    }, [open, defaultShareable])

    const nameInvalid = touched && name.trim() === ''

    const handleCreate = async () => {
        setTouched(true)
        if (name.trim() === '') return
        try {
            setSubmitting(true)
            await onCreate?.({ name: name.trim(), shareable, folder })
            onOpenChange(false)
        } finally {
            setSubmitting(false)
        }
    }

    const handleSelectFolder = () => {
        setFolderPickerOpen(true)
    }

    const handleFolderChosen = (res: { space: Space; folder: Folder }) => {
        setFolder(res.folder)
    }

    const onKeyDown: React.KeyboardEventHandler<HTMLFormElement> = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            void handleCreate()
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="p-0 gap-0">
                <form
                    onKeyDown={onKeyDown}
                    onSubmit={(e) => {
                        e.preventDefault()
                        void handleCreate()
                    }}
                    className="flex flex-col gap-6 p-6"
                >
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        <DialogDescription>
                            {description}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Name */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium" htmlFor="household-name">
                            Name<span className="text-destructive">*</span>
                        </label>
                        <Input
                            id="household-name"
                            placeholder="e.g. Family, Roommates, Personal"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onBlur={() => setTouched(true)}
                            aria-invalid={nameInvalid || undefined}
                        />
                        {nameInvalid && (
                            <p className="text-xs text-destructive">Name is required.</p>
                        )}
                    </div>

                    {/* Shareable */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">Sharing</label>
                        <label className="text-sm flex items-center gap-2 select-none cursor-pointer">
                            <Checkbox
                                checked={shareable}
                                onCheckedChange={(v) => setShareable(!!v)}
                                aria-label="Share household"
                            />
                            <span>Enable sharing with other users</span>
                        </label>
                        <p className="text-xs text-muted-foreground">
                            When sharing is enabled you can invite collaborators (future feature).
                        </p>
                    </div>

                    {/* Folder selection (conditional) */}
                    {shareable && (
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">Folder (Drive)</label>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 min-w-0 rounded-md border border-input bg-background dark:bg-input/30 px-3 py-2 text-sm h-10 flex items-center">
                                    {folder ? (
                                        <span className="truncate" title={folder.displayName}>{folder.displayName}</span>
                                    ) : (
                                        <span className="text-muted-foreground">No folder selected</span>
                                    )}
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSelectFolder}
                                >
                                    {folder ? 'Change' : 'Select'}
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Choose a shared Google Drive folder for attachments & exports.
                            </p>
                        </div>
                    )}

                    <DialogFooter className="mt-2 gap-3 sm:gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={submitting || name.trim() === ''}
                        >
                            {submitting ? 'Creating…' : 'Create'}
                        </Button>
                    </DialogFooter>
                </form>
                <GoogleDriveFolderSelectionDialog
                    open={folderPickerOpen}
                    onOpenChange={setFolderPickerOpen}
                    onSelect={(res) => {
                        handleFolderChosen(res)
                    }}
                    title={folderDialogTitle}
                    description={folderDialogDescription}
                />
            </DialogContent>
        </Dialog>
    )
}
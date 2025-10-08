import { GoogleDriveFileService } from '@/modules/app/services/cloud/google-drive/GoogleDriveFileService';
import type { DriveEntry, Folder, Space } from '@/modules/app/services/cloud/types';
import { Button } from '@/modules/base-ui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/modules/base-ui/components/ui/dialog';
import { Spinner } from '@/modules/base-ui/components/ui/spinner';
import { cn } from '@/modules/base-ui/lib/utils';
import { File as FileIcon, Folder as FolderIcon, RefreshCw } from 'lucide-react';
import React from 'react';

export interface GoogleDriveFolderSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect?: (folder: { space: Space; folder: Folder }) => void;
  initialSpaceId?: Space['id'];
  initialFolder?: Folder | null;
  title?: string;
  description?: string;
}

type EntryNode = DriveEntry; // folder or file

const DRIVE_SPACES: Array<Space['id']> = ['drive', 'sharedWithMe'];

export const GoogleDriveFolderSelectionDialog: React.FC<GoogleDriveFolderSelectionDialogProps> = ({
  open,
  onOpenChange,
  onSelect,
  initialSpaceId = 'drive',
  initialFolder = null,
  title = 'Select Folder',
  description = 'Choose a folder to store shared data.',
}) => {

  const [spaceId, setSpaceId] = React.useState<Space['id']>(initialSpaceId);
  const [currentFolder, setCurrentFolder] = React.useState<Folder | null>(initialFolder);
  const [loading, setLoading] = React.useState(false);
  const [entries, setEntries] = React.useState<EntryNode[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = React.useState<string | null>(null);
  const [history, setHistory] = React.useState<Array<Folder | null>>([initialFolder]);

  const spaceObj = React.useMemo<Space>(() => ({ id: spaceId, displayName: spaceId === 'drive' ? 'My Drive' : 'Shared With Me' }), [spaceId]);

  const load = React.useCallback(async (folder: Folder | null, sp: Space['id']) => {
    if (!GoogleDriveFileService.getInstance()) return;
    setLoading(true);
    setError(null);
    try {
      const list = await GoogleDriveFileService.getInstance().listEntries({ id: sp, displayName: '' }, folder || undefined);
      // Sort folders first then files alphabetically
      list.sort((a, b) => {
        if (a.isFolder && !b.isFolder) return -1;
        if (!a.isFolder && b.isFolder) return 1;
        return a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' });
      });
      setEntries(list);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to load folders';
      setError(message);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setSpaceId(initialSpaceId);
      setCurrentFolder(initialFolder);
      setHistory([initialFolder]);
      setSelectedFolderId(initialFolder ? initialFolder.id : null);
      void load(initialFolder, initialSpaceId);
    }
  }, [open, initialSpaceId, initialFolder, load]);

  // When space changes, go to root of that space
  React.useEffect(() => {
    if (open) {
      setCurrentFolder(null);
      setHistory([null]);
      setSelectedFolderId(null);
      void load(null, spaceId);
    }
  }, [spaceId, open, load]);

  const handleSingleClick = (entry: EntryNode) => {
    if (!entry.isFolder) return; // only folders selectable
    setSelectedFolderId(entry.id);
  };

  const handleDoubleClick = (entry: EntryNode) => {
    if (!entry.isFolder) return;
    const folder: Folder = { id: entry.id, displayName: entry.displayName };
    setCurrentFolder(folder);
    setHistory(h => [...h, folder]);
    setSelectedFolderId(entry.id);
    void load(folder, spaceId);
  };

  // Breadcrumb navigation replaces explicit Up control.

  const commitSelection = () => {
    const selectedEntry = entries.find(f => f.id === selectedFolderId && f.isFolder);
    const folder = selectedEntry ? { id: selectedEntry.id, displayName: selectedEntry.displayName } : currentFolder;
    if (folder && onSelect) {
      onSelect({ space: spaceObj, folder });
      onOpenChange(false);
    }
  };

  const breadcrumb = history.map((f, i) => ({
    label: f?.displayName || (spaceId === 'drive' ? 'My Drive' : 'Shared With Me'),
    folder: f,
    index: i,
  }));

  const navigateToBreadcrumb = (index: number) => {
    if (index === history.length - 1) return; // already there
    const nextHistory = history.slice(0, index + 1);
    const targetFolder = nextHistory[nextHistory.length - 1] || null;
    setHistory(nextHistory);
    setCurrentFolder(targetFolder);
    setSelectedFolderId(targetFolder ? targetFolder.id : null);
    void load(targetFolder, spaceId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="p-6 flex flex-col gap-4 flex-1 overflow-hidden">
          <DialogHeader className="text-left">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex border-b border-border/80 gap-4 px-1">
            {DRIVE_SPACES.map(id => (
              <button
                key={id}
                type="button"
                onClick={() => setSpaceId(id)}
                className={cn(
                  'px-2 pb-2 text-sm -mb-px border-b-2 transition-colors',
                  spaceId === id ? 'border-primary text-primary font-medium' : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {id === 'drive' ? 'My Drive' : 'Shared With Me'}
              </button>
            ))}
          </div>

          {/* Breadcrumb (clickable) + Refresh */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-wrap gap-1 items-center text-xs text-muted-foreground">
              {breadcrumb.map((b, i) => (
                <React.Fragment key={b.index}>
                  {i > 0 && <span className="opacity-40">/</span>}
                  {i === breadcrumb.length - 1 ? (
                    <span className="font-medium text-foreground" aria-current="page">{b.label}</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigateToBreadcrumb(i)}
                      className="hover:text-foreground hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-xs px-0.5"
                    >
                      {b.label}
                    </button>
                  )}
                </React.Fragment>
              ))}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Refresh"
              title="Refresh"
              disabled={loading}
              onClick={() => { void load(currentFolder, spaceId); }}
            >
              <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
            </Button>
          </div>

          {/* Content */}
          <div className="relative min-h-[240px] flex-1 rounded-md border border-border/60 overflow-auto">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm z-10 rounded-md pointer-events-none">
                <Spinner />
              </div>
            )}
            {error && !loading && (
              <div className="p-6 text-sm text-destructive">{error}</div>
            )}
            {!error && entries.length === 0 && !loading && (
              <div className="p-6 text-sm text-muted-foreground">No folders found.</div>
            )}

            <ul className="divide-y divide-border/60">
              {entries.map(entry => {
                const selected = selectedFolderId === entry.id;
                const isFolder = entry.isFolder;
                return (
                  <li
                    key={entry.id}
                    onClick={() => handleSingleClick(entry)}
                    onDoubleClick={() => handleDoubleClick(entry)}
                    className={cn(
                      'px-4 py-2 text-sm select-none flex items-center gap-2',
                      isFolder ? 'cursor-pointer hover:bg-accent/60' : 'opacity-70',
                      selected && 'bg-accent'
                    )}
                  >
                    {isFolder ? (
                      <FolderIcon className="size-4 shrink-0 text-primary" aria-hidden />
                    ) : (
                      <FileIcon className="size-4 shrink-0" aria-hidden />
                    )}
                    <span className="truncate flex-1" title={entry.displayName}>{entry.displayName}</span>
                    {!isFolder && <span className="text-[10px] uppercase tracking-wide text-muted-foreground">FILE</span>}
                  </li>
                );
              })}
            </ul>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={commitSelection} disabled={!selectedFolderId && !currentFolder}>
              Select
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

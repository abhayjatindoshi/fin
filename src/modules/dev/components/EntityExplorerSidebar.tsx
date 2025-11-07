import { useDevEntityNames } from '../hooks/useDevEntityNames';
import { useState, useMemo } from 'react';

interface Props {
  selected: string | null;
  onSelect: (name: string) => void;
}

export const EntityExplorerSidebar: React.FC<Props> = ({ selected, onSelect }) => {
  const names = useDevEntityNames();
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    if (!query.trim()) return names;
    const q = query.toLowerCase();
    return names.filter(n => n.toLowerCase().includes(q));
  }, [names, query]);

  return (
    <div className="h-full flex flex-col gap-2">
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Filter entities"
        className="border rounded px-2 py-1 text-xs bg-background"
      />
      <div className="flex-1 overflow-auto text-sm space-y-0.5">
        {filtered.map(name => (
          <button
            key={name}
            onClick={() => onSelect(name)}
            className={`w-full text-left px-2 py-1 rounded hover:bg-accent/40 truncate ${selected === name ? 'bg-accent/30 font-medium' : ''}`}
            title={name}
          >{name}</button>
        ))}
        {filtered.length === 0 && <div className="text-muted-foreground italic px-2">No matches</div>}
      </div>
    </div>
  );
};

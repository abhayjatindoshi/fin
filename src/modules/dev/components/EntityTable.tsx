import { useRef, useState, useEffect, useMemo } from 'react';
import type { DevEntityRow } from '../hooks/useDevEntityList';
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from '@/modules/base-ui/components/ui/table';

interface Props {
  rows: DevEntityRow[];
  onSelect: (row: DevEntityRow) => void;
  selectedId: string | null;
  height?: number; // px
}

const ROW_HEIGHT = 28;

export const EntityTable: React.FC<Props> = ({ rows, onSelect, selectedId, height = 400 }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = () => setScrollTop(el.scrollTop);
    el.addEventListener('scroll', handler);
    return () => el.removeEventListener('scroll', handler);
  }, []);

  const total = rows.length;
  const visibleCount = Math.ceil(height / ROW_HEIGHT) + 4; // overscan
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 2);
  const endIndex = Math.min(total, startIndex + visibleCount);
  const slice = rows.slice(startIndex, endIndex);

  const offsetY = startIndex * ROW_HEIGHT;
  const containerHeight = total * ROW_HEIGHT;

  const humanCount = useMemo(() => `${total.toLocaleString()} row${total === 1 ? '' : 's'}`, [total]);

  return (
    <div className="flex flex-col h-full">
      <div className="text-xs text-muted-foreground mb-1">{humanCount}</div>
      <div ref={containerRef} className="relative border rounded bg-background overflow-auto" style={{ height }}>
        <Table className="text-xs">
          <TableHeader>
            <TableRow>
              <TableHead className="w-40">ID</TableHead>
              <TableHead>Label</TableHead>
              <TableHead className="w-16">Size</TableHead>
              <TableHead className="w-24">Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <tr style={{ height: containerHeight }}>
              <td colSpan={4} className="p-0">
                <div style={{ transform: `translateY(${offsetY}px)` }}>
                  {slice.map(r => (
                    <TableRow
                      key={r.id}
                      data-state={selectedId === r.id ? 'selected' : undefined}
                      onClick={() => onSelect(r)}
                      className="cursor-pointer"
                      style={{ height: ROW_HEIGHT }}
                    >
                      <TableCell className="font-mono text-[10px] opacity-70 truncate max-w-40" title={r.id}>{r.id}</TableCell>
                      <TableCell className="truncate" title={r.label}>{r.label}</TableCell>
                      <TableCell className="font-mono text-[10px] opacity-60">{r.size}</TableCell>
                      <TableCell className="font-mono text-[10px] opacity-60" title={r.updatedAt?.toISOString()}>{r.updatedAt ? r.updatedAt.toLocaleDateString() : '-'}</TableCell>
                    </TableRow>
                  ))}
                  {total === 0 && <div className="text-xs p-2 text-muted-foreground">(empty)</div>}
                </div>
              </td>
            </tr>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

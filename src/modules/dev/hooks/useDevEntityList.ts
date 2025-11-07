import { useDataSync } from '@/modules/data-sync/providers/DataSyncProvider';
import { useEffect, useMemo, useState } from 'react';

export interface DevEntityRow {
  id: string;
  label: string;
  size: number;
  updatedAt?: Date;
  raw: Record<string, unknown>;
}

export function useDevEntityList(entityName?: string) {
  const { orchestrator } = useDataSync();
  const [rows, setRows] = useState<DevEntityRow[]>([]);

  useEffect(() => {
    if (!orchestrator || !entityName) { setRows([]); return; }
    const repo = orchestrator.repo(entityName as never);
    const mapToRow = (raw: unknown): DevEntityRow => {
      const obj = typeof raw === 'object' && raw !== null ? raw as Record<string, unknown> : {};
      const id = typeof obj.id === 'string' ? obj.id : crypto.randomUUID();
      const name = typeof obj.name === 'string' ? obj.name : undefined;
      const title = typeof obj.title === 'string' ? obj.title : undefined;
      const label = name || title || id || '(no id)';
      const updatedAt = obj.updatedAt instanceof Date
        ? obj.updatedAt
        : typeof obj.updatedAt === 'string' || typeof obj.updatedAt === 'number'
          ? new Date(obj.updatedAt as string | number)
          : undefined;
      return {
        id,
        label,
        size: JSON.stringify(obj).length,
        updatedAt,
        raw: obj
      };
    };
    repo.getAll().then(list => setRows(list.map(mapToRow))).catch(() => undefined);
    const sub = repo.observeAll().subscribe(list => setRows(list.map(mapToRow)));
    return () => sub.unsubscribe();
  }, [orchestrator, entityName]);

  const totalSize = useMemo(() => rows.reduce((sum, r) => sum + r.size, 0), [rows]);

  return { rows, totalSize };
}

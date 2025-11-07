import { EntityName } from '@/modules/app/entities/entities';
import { useDataSync } from '@/modules/data-sync/providers/DataSyncProvider';
import { useEffect, useState } from 'react';

export function useDevEntityNames() {
  const { orchestrator } = useDataSync();
  const [names, setNames] = useState<string[]>([]);
  useEffect(() => {
    if (!orchestrator) { setNames([]); return; }
    setNames(Object.keys(EntityName).sort());
  }, [orchestrator]);
  return names;
}

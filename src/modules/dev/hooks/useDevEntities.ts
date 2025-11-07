import { useDataSync } from '@/modules/data-sync/providers/DataSyncProvider';
import { EntityConfig } from '@/modules/app/entities/entities';
import { useEffect, useMemo, useRef, useState } from 'react';

// Basic dev entity types
export interface DevEntity {
  id: string;
  entityName: string;
  entityKey: string; // derived via key handler (here we omit and mark unknown if not available)
  data: Record<string, unknown>;
}

export interface DevEntityGroup {
  entityName: string;
  entities: DevEntity[];
  total: number;
}

export interface DevEntitiesOverview {
  groups: DevEntityGroup[];
  totalEntities: number;
}

// Internal helper to derive a display id
function toDevEntity(entityName: string, raw: Record<string, unknown>): DevEntity {
  const id = (raw.id as string) || `${entityName}-no-id-${Math.random().toString(36).slice(2, 8)}`;
  return { id, entityName, entityKey: 'n/a', data: raw };
}

export function useDevEntities() {
  const { orchestrator } = useDataSync();
  const [groups, setGroups] = useState<DevEntityGroup[]>([]);
  const subscriptionsRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    // Cleanup previous subs when orchestrator changes
    subscriptionsRef.current.forEach(unsub => unsub());
    subscriptionsRef.current = [];

    if (!orchestrator) {
      setGroups([]);
      return;
    }

    const entityNames = Object.keys(EntityConfig);

    entityNames.forEach(entityName => {
      const repo = orchestrator.repo(entityName as never);
      // Initial load
      repo.getAll().then(list => {
        setGroups(prev => {
          const others = prev.filter(g => g.entityName !== entityName);
          const entities = list.map(e => toDevEntity(entityName, e as Record<string, unknown>));
          return [...others, { entityName, entities, total: entities.length }].sort((a, b) => a.entityName.localeCompare(b.entityName));
        });
      }).catch(() => undefined);

      const sub = repo.observeAll().subscribe(list => {
        setGroups(prev => {
          const others = prev.filter(g => g.entityName !== entityName);
          const entities = list.map(e => toDevEntity(entityName, e as Record<string, unknown>));
          return [...others, { entityName, entities, total: entities.length }].sort((a, b) => a.entityName.localeCompare(b.entityName));
        });
      });
      subscriptionsRef.current.push(() => sub.unsubscribe());
    });

    return () => {
      subscriptionsRef.current.forEach(unsub => unsub());
      subscriptionsRef.current = [];
    };
  }, [orchestrator]);

  const totalEntities = useMemo(() => groups.reduce((sum, g) => sum + g.total, 0), [groups]);

  return { overview: { groups, totalEntities } as DevEntitiesOverview };
}

export function useDevEntitySearch(overview: DevEntitiesOverview | null, query: string) {
  return useMemo(() => {
    if (!overview || !query.trim()) return overview?.groups || [];
    const q = query.toLowerCase();
    return overview.groups.map(g => ({
      ...g,
      entities: g.entities.filter(e => {
        const raw = e.data;
        // Search common fields + JSON string fallback
        const keys = ['id', 'name', 'title'];
        for (const k of keys) {
          const v = raw[k];
          if (typeof v === 'string' && v.toLowerCase().includes(q)) return true;
        }
        return JSON.stringify(raw).toLowerCase().includes(q);
      }),
      total: g.entities.length
    })).filter(g => g.entities.length > 0);
  }, [overview, query]);
}

# Data Sync Module

> Offline-first, multi-tier, reactive entity storage and synchronization layer.

## 🛠 Contribution Guide

Thank you for considering improvements! This module is central to reliable data handling. Please follow these guidelines to keep it robust and understandable.

### Core Principles
- **Determinism**: All persisted blobs must serialize deterministically (sorted keys) before hashing.
- **Separation of Concerns**: Keep identity, persistence, metadata, sync, and observability layers isolated.
- **Minimal Surface**: Prefer extending strategies or adapters instead of modifying core orchestration.
- **Last-Writer-Wins**: Conflict resolution is timestamp-based with delete precedence; don’t silently change this policy.
- **Observability First**: Any state mutation MUST emit the appropriate event so observers stay consistent.
- **Safety over Cleverness**: Readability > micro-optimizations (unless profiling shows a bottleneck).

### When Adding a New Entity Type
1. Define its TypeScript interface extending `Entity`.
2. Get a repository via `DataOrchestrator.getInstance().repo('<EntityName>')`.
3. Use repository methods (`save`, `get`, `observe`, etc.). No direct `store` access.
4. Ensure `updatedAt` is always refreshed on mutation (handled automatically by `DataManager.save`).

### Adding a New Persistence Adapter
Implement either:
- `IPersistence` (bulk blob only) OR
- `IStore` (bulk blob + per-entity CRUD) — used for the fast primary store.

Checklist:
- Must return `null` for missing keys (not `undefined`).
- Must not mutate provided data objects in-place.
- Ensure atomicity (per key) where possible.
- If asynchronous batching is used, flush before test assertions.

### Adding a New Entity Key Strategy
Implement `IEntityKeyStrategy<FilterOptions>` or extend `EntityKeyDateStrategy`.
- Use a stable `separator` (avoid collisions with natural data).
- `getKey` must be pure.
- `entityKeyFilter` should return only keys the caller is authorized to read (authorization layer may sit above this in future).

### Extending Sync Behavior
If modifying `SyncHandler`:
- Preserve current public assumptions (hash-based change detection, bucket model, last-writer-wins).
- Add unit tests around `partitionDifferences`, conflict scenarios (A newer, B newer, simultaneous delete vs update, identical timestamps w/ differing states).
- Document any additional resolution rules in this README.

### Introducing New Conflict Policies
- Add an abstraction (e.g. `ConflictResolver`) instead of branching inside `resolveEntity`.
- Include migration notes for existing metadata.

### Logging Standards
- Use `this.logger.v` for fine-grained steps; `i` for lifecycle milestones; `w` for recoverable anomalies; `e` for failures.
- Tag: always `this.constructor.name`.

### Testing Guidelines
Recommended test focus (in future test suite):
- ID Generation uniqueness & format.
- Metadata hash validity after saves/deletes.
- Sync scenarios:
  - Missing key copy.
  - Divergent key reconciliation.
  - Delete vs update race.
  - Identical timestamps (delete precedence).
- Observable propagation (single + collection).

### Performance Considerations
Before optimizing:
- Profile entity key blob size distribution.
- Measure sync frequency vs mutation rate.
- Consider splitting large keys if blobs exceed practical limits.

### PR Checklist
- [ ] Added / updated README if behavior changes.
- [ ] Deterministic serialization preserved.
- [ ] New strategy / adapter documented.
- [ ] No direct mutation of cached metadata objects except via defined flows.
- [ ] Logging added at appropriate levels.
- [ ] Edge cases covered (empty, missing keys, deleted states).

---

## 📦 Architectural Overview

The module implements a layered data system:

| Layer | Purpose |
|-------|---------|
| Identity / Key Strategy | Logical partitioning + ID format generation |
| Persistence (Store / Local / Cloud) | Durable & hierarchical storage tiers |
| Metadata Manager | Hash & structural summary for diff detection |
| Sync Engine (Scheduler + Handler) | Directional reconciliation between tiers |
| Event + Observable Layer | Reactive change propagation |
| Repositories | Entity-centric consumer API |

### Flow Summary
1. Entities are grouped into **entity keys** (partition units).
2. Each key persists as a single `EntityKeyData` blob containing active + deleted records.
3. `Metadata` maintains per-key hashes + counts for quick divergence detection.
4. Sync compares metadata (timestamps + hashes) — loads only differing keys.
5. Conflict resolution picks the object (or deletion) with the latest timestamp.
6. Observers update via RxJS subjects triggered by events.

---

## 🧩 Key Data Structures

### Entity
```ts
interface Entity {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  version?: number;
}
```

### EntityKeyData Shape (Example)
```jsonc
{
  "UserAccount": {
    "region123.abcd123": { "id": "region123.abcd123", "updatedAt": "..." }
  },
  "deleted": {
    "UserAccount": { "oldId": "2025-09-25T10:11:12.000Z" }
  }
}
```

### Metadata (Excerpt)
```jsonc
{
  "updatedAt": "2025-09-28T...",
  "entityKeys": {
    "app.region123": {
      "hash": 918237461,
      "updatedAt": "2025-09-28T...",
      "entities": { "UserAccount": { "count": 42, "deletedCount": 3 } }
    }
  }
}
```

---

## 🔑 Identity & Partitioning
- IDs: `<logicalKey>.<nanoid>`
- Entity Keys: `<prefix>.<logicalKey>` (global fallback: `<prefix>.global`)
- Strategy supplies `getKey` + list filtering for queries.

`EntityKeyDateStrategy` provides year-based expansion (extend it to implement month/day partition logic).

---

## 🔄 Synchronization Algorithm (Condensed)
1. Load metadata A + B.
2. If `updatedAt` equal → stop.
3. Partition keys:
   - Only A → copy to B.
   - Only B → copy to A.
   - Both + hash mismatch → deep diff.
4. For mismatched keys:
   - Convert both sides to typed form (`active` / `deleted`).
   - Partition entity names, then entity IDs.
   - For common IDs → compare `updatedAt` / `deletedAt` → newer wins; equal & state differs → delete propagates.
5. Apply bucket for B.
6. Re-fetch metadata A; if unchanged → apply bucket for A; else skip to avoid stale overwrite.
7. Recompute key metadata (hash + counts) after applying.

Conflict Model: **Last-writer-wins**, with **delete dominance on equal timestamps**.

---

## 👀 Reactive Observables
- `observe(id)` → single-entity stream (`Entity | null`).
- `observeAll(options)` → aggregated collection across all matching entity keys.
- Internally backed by `BehaviorSubject` maps keyed by `[entityKey][entityName][id]`.

---

## 🧪 Filtering & Queries
`QueryOptions` supports:
- `ids` inclusion
- `where` shallow field equality
- multi-field `sort`

Filtering is in-memory across the flattened result set of all candidate entity keys.

---

## 🚀 Quick Start
```ts
import { DataOrchestrator } from './modules/data-sync/DataOrchestrator';
import { EntityKeyDateStrategy, DateStrategyOptions } from './modules/data-sync/strategies/EntityKeyDateStrategy';

class YearStrategy extends EntityKeyDateStrategy {
  separator = '.';
  identifierLength = 8;
  getEntityKeyWithoutPrefix(entityName: string, entity: any) {
    const year = new Date(entity.createdAt || Date.now()).getFullYear();
    return `${entityName}.${year}`;
  }
  generateAllEntityKeys(prefix: string, entityName: string, year: number) {
    return [`${prefix}.${entityName}.${year}`];
  }
}

// Minimal in-memory store implementation (example)
class MemoryStore {
  private blobs: Record<string, any> = {};
  private cache: Record<string, any> = {};
  loadData = async (k: string) => this.blobs[k] ?? null;
  storeData = async (k: string, d: any) => { this.blobs[k] = d; };
  clearData = async (k: string) => { delete this.blobs[k]; };
  get(key: string, entityName: string, id: string) {
    const blob = this.blobs[key];
    return blob?.[entityName]?.[id] ?? null;
  }
  getAll(key: string, entityName: string) {
    const blob = this.blobs[key];
    return Object.values(blob?.[entityName] ?? {});
  }
  save(key: string, entityName: string, entity: any) {
    this.blobs[key] = this.blobs[key] || {};
    this.blobs[key][entityName] = this.blobs[key][entityName] || {};
    this.blobs[key][entityName][entity.id] = entity;
    return true;
  }
  delete(key: string, entityName: string, id: string) {
    const blob = this.blobs[key];
    if (blob?.[entityName]?.[id]) delete blob[entityName][id];
  }
}

(async () => {
  const store = new MemoryStore();
  const local = new MemoryStore();
  await DataOrchestrator.load({
    prefix: 'app',
    store,
    local,
    strategy: new YearStrategy()
  });

  type User = { id?: string; name: string; createdAt?: Date; updatedAt?: Date; version?: number };
  const repo = DataOrchestrator.getInstance().repo<User>('User');

  const id = repo.save({ name: 'Alice' });
  console.log('Saved ID', id);
  console.log('Fetched', await repo.get(id));
})();
```

---

## ⚠ Limitations
- Full key blob rewrite per mutation may not scale for very large partitions.
- No CRDT / semantic merge (timestamp only).
- No encryption/compression layer yet.
- No index acceleration for complex queries.

---

## 🔮 Future Enhancements (Ideas)
- Pluggable `ConflictResolver` interface.
- Streaming / chunked key storage.
- Delta-based sync (patch sets) vs whole-blob diffs.
- Integrity verification (hash chain / signatures).
- Telemetry: sync duration, conflict frequency.

---

## 🧰 Internal File Map
- `DataOrchestrator.ts` — lifecycle & composition.
- `DataManager.ts` — CRUD + lazy hydration.
- `DataRepository.ts` — entity-facing API.
- `EntityKeyHandler.ts` — key + ID logic.
- `MetadataManager.ts` — per-key hash & summary.
- `SyncScheduler.ts` — queued directional sync.
- `SyncHandler.ts` — diff + application engine.
- `ObservableManager.ts` — reactive layer.
- `interfaces/*` — abstraction contracts.
- `strategies/*` — key partition strategies.

---

## ✅ Operational Summary
1. Orchestrator loads + initial syncs.
2. Writes go to `store`, events fire.
3. Periodic syncs push `store -> local` and `local -> cloud`.
4. On access, missing keys hydrate downward (cloud → local → store).
5. Hash-based detection keeps sync efficient.

---

Questions or extension ideas? Open an issue or start a discussion referencing the section you’d like to evolve.

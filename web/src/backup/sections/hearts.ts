// The tin hearts: each game's find (tinheart.dat, kept beside its saves), the wall clock's heart
// and how often its chicken has popped out, EGG.EXE's heart overrides, the once-made decision
// about hearts found before the clock's joined, and whether the hunt's reveal was seen.
// Merge: found stays found (the first find's date stays), the pops keep the higher count.
import { HEART_FILE, localOf } from '../inventory';
import type { World } from '../world';
import { describeKeys, injectLocal, isRecord, json, need, plural, stringMap, type Section } from './types';

export interface HeartsPayload {
  /** Save id -> its tinheart.dat. */
  found: Record<string, Uint8Array>;
  local: Record<string, string>;
}

type Overrides = Record<string, 'added' | 'broken'>;
const OVERRIDES = 'gm-tin-hearts';
const CLOCK = 'gm-clock-heart';
const POPS = 'gm-clock-pops';
const REVEAL = 'gm-heart-reveal';

const overrides = (local: Record<string, string>): Overrides => {
  const o = json<Overrides>(local[OVERRIDES]);
  return isRecord(o) ? o : {};
};

function finds(w: World): Record<string, Uint8Array> {
  const out: Record<string, Uint8Array> = {};
  for (const [id, rec] of Object.entries(w.stores.saves)) {
    const f = isRecord(rec) ? rec[HEART_FILE] : undefined;
    if (f instanceof Uint8Array) out[id] = f;
  }
  return out;
}

const heartCount = (p: HeartsPayload) => {
  const o = overrides(p.local);
  const ids = new Set([...Object.keys(p.found).map((id) => id.replace(/^game:/, '')), ...Object.keys(o).filter((k) => o[k] === 'added')]);
  for (const [k, v] of Object.entries(o)) if (v === 'broken') ids.delete(k);
  return ids.size + (p.local[CLOCK] && !o['desk-clock'] ? 1 : 0);
};

export const hearts: Section<HeartsPayload> = {
  id: 'hearts',
  title: 'Tin hearts',
  short: 'Tin hearts',
  description: 'The tin hearts you have found, in the games and in the room, and EGG.EXE’s changes.',
  unit: ['heart found', 'hearts found'],
  extract: (w) => ({ found: finds(w), local: localOf('hearts', w.local) }),
  count: heartCount,
  validate(raw) {
    need(isRecord(raw) && isRecord(raw.found), 'tin hearts');
    for (const f of Object.values(raw.found)) need(f instanceof Uint8Array, 'tin hearts');
    return { found: raw.found as Record<string, Uint8Array>, local: stringMap(raw.local, 'tin hearts') };
  },
  merge(mine, theirs, ctx) {
    const first = ctx.prefer === 'theirs';
    const found = first ? { ...mine.found, ...theirs.found } : { ...theirs.found, ...mine.found };
    const local = first ? { ...mine.local, ...theirs.local } : { ...theirs.local, ...mine.local };
    const a = overrides(mine.local);
    const o: Overrides = { ...a };
    for (const [k, v] of Object.entries(overrides(theirs.local))) if (first || (v === 'added' && o[k] !== 'broken')) o[k] = v;
    if (Object.keys(o).length) local[OVERRIDES] = JSON.stringify(o);
    const pops =
      first && theirs.local[POPS] !== undefined
        ? Number(theirs.local[POPS]) || 0
        : Math.max(Number(mine.local[POPS] ?? 0) || 0, Number(theirs.local[POPS] ?? 0) || 0);
    if (pops) local[POPS] = String(pops);
    if (mine.local[REVEAL] === '1' || theirs.local[REVEAL] === '1') local[REVEAL] = '1';
    return { found, local };
  },
  inject(w, mine, next) {
    for (const id of Object.keys(mine.found)) {
      const rec = { ...((w.stores.saves[id] as Record<string, Uint8Array> | undefined) ?? {}) };
      delete rec[HEART_FILE];
      if (Object.keys(rec).length) w.stores.saves[id] = rec;
      else delete w.stores.saves[id];
    }
    for (const [id, f] of Object.entries(next.found)) w.stores.saves[id] = { ...(w.stores.saves[id] ?? {}), [HEART_FILE]: f };
    injectLocal(w, mine.local, next.local);
  },
  describe(mine, next) {
    const a = heartCount(mine);
    const b = heartCount(next);
    if (b > a) return [`Finds ${plural(b - a, ['heart', 'hearts'])}`];
    if (b < a) return [`Unfinds ${plural(a - b, ['heart', 'hearts'])}`];
    return describeKeys(mine.local, next.local);
  },
};

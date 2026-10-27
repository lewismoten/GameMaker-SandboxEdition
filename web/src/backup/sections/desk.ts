// The 1994 desk: the PC's C: drive (downloads with their dates, files deleted, folders made)
// and its other records (PLAYGAME.REG's serial, games cracked…), and the room's own state in
// localStorage: the registration mail, the clock's offset, the BBS account (file points and
// downloads), the tic-tac-toe door, the modem's speed, the mug, the shelf, the pad, the mouse
// and the sound card. Merge: C:'s lists become one (the earliest date for each); every other
// record and setting keeps this browser's, taking the file's where there is none here.
import { localOf } from '../inventory';
import { same } from '../codec';
import { describeKeys, fillGaps, injectLocal, isRecord, need, plural, stringMap, type Section } from './types';

export interface DeskPayload {
  records: Record<string, unknown>;
  local: Record<string, string>;
}

type Dated = [string, number][];
interface CDrive {
  ids: Dated;
  deleted: string[];
  dirs: Dated;
}

const isDated = (v: unknown): v is Dated => Array.isArray(v) && v.every((x) => Array.isArray(x) && typeof x[0] === 'string' && typeof x[1] === 'number');
const isCDrive = (v: unknown): v is CDrive => isRecord(v) && isDated(v.ids) && isDated(v.dirs) && Array.isArray(v.deleted);

function joinDated(a: Dated, b: Dated): Dated {
  const m = new Map<string, number>(a);
  for (const [k, t] of b) m.set(k, Math.min(m.get(k) ?? t, t));
  return [...m];
}

export const desk: Section<DeskPayload> = {
  id: 'desk',
  title: 'The 1994 desk',
  description: 'The PC’s C: drive, your registration and BBS account, file points, and how the room was left.',
  unit: ['item', 'items'],
  extract: (w) => ({ records: { ...w.stores.desk }, local: localOf('desk', w.local) }),
  count: (p) => {
    const c = p.records.C;
    return (isCDrive(c) ? c.ids.length + c.dirs.length : 0) + Object.keys(p.records).filter((k) => k !== 'C').length + Object.keys(p.local).length;
  },
  validate(raw) {
    need(isRecord(raw) && isRecord(raw.records), 'desk');
    if ('C' in raw.records) need(isCDrive(raw.records.C), 'C: drive');
    return { records: raw.records, local: stringMap(raw.local, 'desk') };
  },
  merge(mine, theirs) {
    const records = { ...theirs.records, ...mine.records };
    const a = mine.records.C;
    const b = theirs.records.C;
    if (isCDrive(a) && isCDrive(b)) {
      const c: CDrive = { ids: joinDated(a.ids, b.ids), deleted: [...new Set([...a.deleted, ...b.deleted])], dirs: joinDated(a.dirs, b.dirs) };
      records.C = same(c, a) ? a : c;
    }
    return { records, local: fillGaps(mine.local, theirs.local) };
  },
  inject(w, mine, next) {
    for (const k of Object.keys(mine.records)) delete w.stores.desk[k];
    Object.assign(w.stores.desk, next.records);
    injectLocal(w, mine.local, next.local);
  },
  describe(mine, next) {
    const out: string[] = [];
    const a = mine.records.C;
    const b = next.records.C;
    const files = (c: unknown) => (isCDrive(c) ? c.ids.length : 0);
    if (files(b) > files(a)) out.push(`Adds ${plural(files(b) - files(a), ['download', 'downloads'])} to C:`);
    else if (!same(a, b)) out.push('Changes C:');
    const added = Object.keys(next.records).filter((k) => k !== 'C' && !(k in mine.records)).length;
    const changed = Object.keys(next.records).filter((k) => k !== 'C' && k in mine.records && !same(mine.records[k], next.records[k])).length;
    if (added) out.push(`Adds ${plural(added, ['PC record', 'PC records'])}`);
    if (changed) out.push(`Changes ${plural(changed, ['PC record', 'PC records'])}`);
    return [...out, ...describeKeys(mine.local, next.local)];
  },
};

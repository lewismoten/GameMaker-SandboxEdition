// What ROOMFIX.EXE can put back: the desk room's small remembered states, each kept by its own
// module under desk/ (the DOS page may not load the desk, so the storage keys are named here; the
// test checks each key is still in its owner). The safe is the one real record, in the save.
// It never touches game saves, achievements, felt eggs or tin hearts.
import { loadSafe, saveSafe, emptySafe } from '../../fortKnox/store';

export interface FixItem {
  id: string;
  /** Plain words for the list. */
  label: string;
  group: 'safe' | 'room';
  /** The current value, in a few words. */
  show: () => Promise<string>;
  /** Puts it back; returns what it did. `full` also gives back what was spent (the safe). */
  reset: (full: boolean) => Promise<string>;
}

/** Where each key lives, so a test can check the owner still uses it. */
export const KEYS = {
  overhead: { key: 'gm-overhead', store: 'session', owner: 'desk/props/roomLight.ts' },
  blacklight: { key: 'gm-blacklight', store: 'session', owner: 'desk/props/blacklight.ts' },
  mug: { key: 'gm-mug', store: 'local', owner: 'desk/mug/mug.ts' },
  pad: { key: 'gm-desk-pad', store: 'local', owner: 'desk/pc/padChoice.ts' },
  mouse: { key: 'gm-desk-mouse', store: 'local', owner: 'desk/pc/tray.ts' },
  shelf: { key: 'gm-shelf-front', store: 'local', owner: 'desk/boxes/shelf.ts' },
} as const;

const area = (s: 'session' | 'local') => (s === 'session' ? sessionStorage : localStorage);
const read = (k: keyof typeof KEYS): string | null => {
  try {
    return area(KEYS[k].store).getItem(KEYS[k].key);
  } catch {
    return null;
  }
};
const clear = (k: keyof typeof KEYS): boolean => {
  try {
    const had = area(KEYS[k].store).getItem(KEYS[k].key) !== null;
    area(KEYS[k].store).removeItem(KEYS[k].key);
    return had;
  } catch {
    return false;
  }
};
const tell = (event: string) => window.dispatchEvent(new CustomEvent(event));
const word = (v: string | null, plain: string) => (v === null ? plain : v);

export const ITEMS: readonly FixItem[] = [
  {
    id: 'SAFE',
    label: "Teddy's toy safe door",
    group: 'safe',
    async show() {
      const r = await loadSafe();
      const n = Object.values(r.treats).reduce((a, b) => a + b, 0);
      return `${r.opened ? 'has been opened' : 'never opened'}; ${r.spent} coins spent, ${n} treats bought`;
    },
    async reset(full) {
      const r = await loadSafe();
      await saveSafe(full ? emptySafe() : { ...r, opened: false });
      return full ? 'locked; coins and treats cleared too' : 'locked as if never opened (coins and treats kept)';
    },
  },
  {
    id: 'LIGHTS',
    label: 'Overhead light and black light',
    group: 'room',
    async show() {
      return `overhead ${word(read('overhead'), 'by the clock')}, black light ${word(read('blacklight'), 'by the clock')}`;
    },
    async reset() {
      const a = clear('overhead');
      const b = clear('blacklight');
      return a || b ? "back to the clock's choice (takes hold when the room reloads)" : 'already by the clock';
    },
  },
  {
    id: 'LUME',
    label: 'Wall clock lume paint',
    group: 'room',
    async show() {
      return 'charge is kept only while the room is open';
    },
    async reset() {
      tell('gm-lume-reset');
      return 'paint starts over, as if the room had just loaded';
    },
  },
  {
    id: 'MUG',
    label: 'Mug choice',
    group: 'room',
    async show() {
      const v = read('mug');
      return v === null ? 'the first mug' : 'your pick';
    },
    async reset() {
      const had = clear('mug');
      tell('gm-mug-change');
      return had ? 'back to the first mug' : 'already the first mug';
    },
  },
  {
    id: 'PAD',
    label: 'Mouse pad print',
    group: 'room',
    async show() {
      return word(read('pad'), 'the BBS print');
    },
    async reset() {
      const had = clear('pad');
      tell('gm-pad-change');
      return had ? 'back to the BBS print' : 'already the BBS print';
    },
  },
  {
    id: 'MOUSE',
    label: 'Mouse parking spot',
    group: 'room',
    async show() {
      return read('mouse') === null ? 'where it always sits' : 'moved';
    },
    async reset() {
      return clear('mouse') ? 'parked where it always sits (shows on the next visit)' : 'already parked';
    },
  },
  {
    id: 'SHELF',
    label: 'Box in front on the shelf',
    group: 'room',
    async show() {
      return read('shelf') === null ? 'the usual one' : 'you turned another out';
    },
    async reset() {
      return clear('shelf') ? 'back to the usual one (shows on the next visit)' : 'already the usual one';
    },
  },
];

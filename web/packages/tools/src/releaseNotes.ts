// Release notes from a disk diff: one short sentence per kind of change ("Changed 2 maps (A.MAP, B.MAP)
// and 1 palette (X.PAL). Added 1 sound (SONG3.VOC). Removed 1 picture (OLD.GIF)."). Pure and
// deterministic: the diff is already sorted, kinds go in a fixed order, no clock, no "we".
import type { DiskDiff } from './diskDiff';

/** Singular and plural words per kind, in the order notes list them. */
const KINDS: [kind: string, one: string, many: string][] = [
  ['gam', 'game file', 'game files'],
  ['map', 'map', 'maps'],
  ['bbl', 'background block set', 'background block sets'],
  ['mbl', 'monster block set', 'monster block sets'],
  ['cbl', 'character block set', 'character block sets'],
  ['chr', 'character', 'characters'],
  ['mon', 'monster set', 'monster sets'],
  ['pal', 'palette', 'palettes'],
  ['gif', 'picture', 'pictures'],
  ['fli', 'animation', 'animations'],
  ['voc', 'sound', 'sounds'],
  ['text', 'text file', 'text files'],
];
const OTHER = ['other file', 'other files'];
const SHOWN = 4;

const upper = (n: string) => n.toUpperCase();
const kindIndex = (k: string) => {
  const i = KINDS.findIndex(([x]) => x === k);
  return i < 0 ? KINDS.length : i;
};

/** "A, B, C and 2 more" - the first few names, then a count. */
function nameList(names: string[]): string {
  const shown = names.slice(0, SHOWN).map(upper).join(', ');
  return names.length > SHOWN ? `${shown} and ${names.length - SHOWN} more` : shown;
}

/** "2 maps (A.MAP, B.MAP), 1 palette (X.PAL)" for files grouped by kind. */
function groups(files: { name: string; kind: string }[]): string {
  const by = new Map<string, string[]>();
  for (const f of files) {
    const k = KINDS.some(([x]) => x === f.kind) ? f.kind : 'other';
    by.set(k, [...(by.get(k) ?? []), f.name]);
  }
  return [...by.entries()]
    .sort((a, b) => kindIndex(a[0]) - kindIndex(b[0]))
    .map(([k, names]) => {
      const [one, many] = KINDS.find(([x]) => x === k)?.slice(1) ?? OTHER;
      return `${names.length} ${names.length === 1 ? one : many} (${nameList(names)})`;
    })
    .join(', ');
}

/** Release-note text for a diff, or '' when nothing differs. Sentences: Changed, Added, Removed. */
export function releaseNotes(d: DiskDiff): string {
  const out: string[] = [];
  if (d.changed.length) out.push(`Changed ${groups(d.changed)}.`);
  if (d.added.length) out.push(`Added ${groups(d.added)}.`);
  if (d.removed.length) out.push(`Removed ${groups(d.removed)}.`);
  return out.join(' ');
}

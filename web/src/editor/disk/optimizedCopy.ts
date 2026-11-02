// "Make an optimized copy": the pack applied to a separate game in My Games instead of this one, so
// the saved games of this game keep working. The copy's name says what it came from and when it was
// optimized, in My Games and, shortened to fit DOS, in the .gam's title.
import { SCENEDESCLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { diffDisks } from '@lewismoten/gamemaker-sandbox-tools/disk-diff';
import { menuVersionOf, getSection, setSection, emptyCompanion, type Companion } from '../../project/companion';
import { versionAt } from '../../project/checkpoint';
import type { GameFiles } from '../../project/files';
import type { StoredCheckpoint } from '../../project/storage';

/** What to call the version this copy was packed from: the release tag the game is at, else its menu version, else the newest tag with a "+", else the date. */
export function packedFrom(list: readonly StoredCheckpoint[], files: GameFiles, companion: Companion | undefined, now = new Date()): string {
  const tagged = list.map((c, i) => [c, i] as const).filter(([c]) => c.tag);
  const here = [...tagged].reverse().find(([, i]) => {
    const d = diffDisks(versionAt([...list], i), new Map(files.entries()));
    return !(d.changed.length + d.added.length + d.removed.length);
  });
  if (here) return here[0].tag!;
  const v = menuVersionOf(companion).version;
  if (v) return /^\d/.test(v) ? `v${v}` : v;
  if (tagged.length) return `${tagged[tagged.length - 1][0].tag}+`;
  return now.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

/** “Tune-Up (optimized from v2.0)”, with a number added when you already have that name. */
export function optimizedName(name: string, from: string, taken: readonly string[]): string {
  const base = `${name.replace(/ \(optimized from .*\)( \d+)?$/, '')} (optimized from ${from})`;
  const used = new Set(taken.map((n) => n.toLowerCase()));
  for (let i = 1; ; i++) {
    const n = i === 1 ? base : `${base} ${i}`;
    if (!used.has(n.toLowerCase())) return n;
  }
}

/** The copy's .gam title within the 19 characters DOS keeps: “Tune-Up (opt v2.0)”, the title cut short to make room, else just “(opt)”. */
export function optimizedTitle(title: string, from: string): string {
  const max = SCENEDESCLEN - 1;
  const base = title.replace(/ \(opt( [^)]*)?\)$/, '').trim();
  for (const tail of [` (opt ${from})`, ' (opt)']) {
    const room = max - tail.length;
    if (room >= Math.min(base.length, 6)) return `${base.slice(0, room).trimEnd()}${tail}`;
  }
  return base.slice(0, max);
}

/** The companion store the steps' remapExtras needs, over a copy of the project's notes. */
export function storeFor(companion: Companion | undefined): {
  companion: Companion;
  extras<T>(f: string, s: string, fallback: T): T;
  setExtras(f: string, s: string, v: unknown): void;
} {
  const c = structuredClone(companion ?? emptyCompanion());
  return { companion: c, extras: (f, s, fallback) => getSection(c, f, s, fallback), setExtras: (f, s, v) => setSection(c, f, s, v) };
}

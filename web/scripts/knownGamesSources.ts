// The known games, one by one, for knownGamesTable.ts and knownGamesSheets.ts: every game on
// the CD (../cd), and, when the maintainer's research folders exist, the found games
// (.for-lewis/reference/found-games) and the public archive's zips (.for-lewis/reference/archive).
// Each comes with its label (a folder name, "<folder>/<file>.gam" when the folder has several, or "<zip name>/<file>.gam"), the .gam and its files.
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { readZip } from '@lewismoten/gamemaker-sandbox-archives/zip';

export interface KnownSource {
  label: string;
  /** Where it came from: the CD, a found-games folder or an archive zip. */
  from: 'cd' | 'found' | 'zip';
  gam: Uint8Array;
  get: (name: string) => Uint8Array | undefined;
}

function walk(dir: string, keep: (n: string) => boolean): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return walk(p, keep);
    return keep(n) ? [p] : [];
  });
}

function* folderGames(root: string, from: 'cd' | 'found'): Generator<KnownSource> {
  for (const gam of walk(root, (n) => /\.gam$/i.test(n)).sort()) {
    const dir = dirname(gam);
    const names = new Map(readdirSync(dir).map((n) => [n.toLowerCase(), n]));
    const get = (name: string) => {
      const real = names.get(name.toLowerCase());
      return real ? new Uint8Array(readFileSync(join(dir, real))) : undefined;
    };
    const several = [...names.keys()].filter((n) => n.endsWith('.gam')).length > 1;
    yield { label: several ? `${basename(dir)}/${basename(gam).toLowerCase()}` : basename(dir), from, gam: new Uint8Array(readFileSync(gam)), get };
  }
}

/** The maintainer's reference folder: --reference, or .for-lewis/reference beside web/. */
function referenceDir(argv: string[]): string {
  const i = argv.indexOf('--reference');
  return i >= 0 ? argv[i + 1] : join(import.meta.dirname, '../../.for-lewis/reference');
}

/**
 * The game a label belongs to, so copies from several collections share it: a zip's slug
 * (game-maker_<slug>_<collection>) or the folder name, with the .gam's name when there is one.
 */
export function slugOf(label: string): string {
  const [box, gam] = label.split('/');
  const parts = box.split('_');
  const slug = (parts.length >= 3 ? parts[1] : box.replace(/^game-maker_/, '')).toLowerCase();
  return gam ? `${slug}:${gam.replace(/\.gam$/, '')}` : slug;
}

/** A game's slug to whether the archive walk bot won it in any mode (.for-lewis/research/archive-walks). */
export function botWins(argv: string[]): Map<string, boolean> {
  const dir = join(referenceDir(argv), '../research/archive-walks');
  const won = new Map<string, boolean>();
  if (!existsSync(dir)) return won;
  for (const n of readdirSync(dir).filter((f) => f.endsWith('.status.json') && !f.includes('.attempt'))) {
    const s = JSON.parse(readFileSync(join(dir, n), 'utf8')) as { source?: string; exitCode: number };
    if (s.exitCode !== 0 && s.exitCode !== 1) continue; // the walk didn't run
    // the zip it walked, or the run's name: <date>-[batchN-][game-]NN-<zip or slug>-<mode>.status.json
    const name =
      s.source
        ?.split('/')
        .pop()!
        .replace(/\.zip$/, '') ?? n.replace(/^\d{4}-\d\d-\d\d-(?:batch\d+-)?(?:game-)?\d+-/, '').replace(/-(?:default|basic-keys)\.status\.json$/, '');
    const slug = slugOf(name);
    won.set(slug, won.get(slug) === true || s.exitCode === 0);
  }
  return won;
}

/** The known games; `bad` hears a zip that can't be read. */
export async function* knownSources(argv: string[], bad: () => void = () => undefined): AsyncGenerator<KnownSource> {
  const here = import.meta.dirname;
  yield* folderGames(join(here, '../../cd'), 'cd');
  const lewis = referenceDir(argv);
  const archiveArg = argv.indexOf('--archive');
  const archive = archiveArg >= 0 ? argv[archiveArg + 1] : join(lewis, 'archive');
  if (existsSync(join(lewis, 'found-games'))) yield* folderGames(join(lewis, 'found-games'), 'found');
  if (!existsSync(archive)) return;
  for (const zip of walk(archive, (n) => /\.zip$/i.test(n)).sort()) {
    let entries;
    try {
      entries = await readZip(new Uint8Array(readFileSync(zip)));
    } catch {
      bad();
      continue;
    }
    const byDir = new Map<string, Map<string, Uint8Array>>();
    for (const e of entries) {
      const d = dirname(e.name.replace(/\\/g, '/'));
      if (!byDir.has(d)) byDir.set(d, new Map());
      byDir.get(d)!.set(basename(e.name).toLowerCase(), e.data);
    }
    for (const files of byDir.values())
      for (const [name, data] of files)
        if (name.endsWith('.gam')) yield { label: basename(zip, '.zip') + '/' + name, from: 'zip', gam: data, get: (n) => files.get(n.toLowerCase()) };
  }
}

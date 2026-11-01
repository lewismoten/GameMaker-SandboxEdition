// Dev server only: a walkthrough file kept outside Git in the maintainer's .for-lewis folder
// (research/archive-walks/<zip>/<GAM>.walkthrough.json, written by `npm run walk:auto`), played
// for the game with the same .gam name so it needs no "Open a walkthrough file…". It is
// fetched through Vite's /@fs/ route. The production build drops this module (walkDialog.ts
// imports it only under import.meta.env.DEV) and the folder is never needed: with it missing
// (CI, other clones) nothing is found and nothing changes.
import type { Walkthrough } from '../../walkthrough/format';
import { checkWalkFile } from './walkFile';

export interface LocalWalk {
  walk: Walkthrough;
  /** Said in the player's Redo… menu. */
  note: string;
}

const NOTE =
  'This walkthrough is a local file from your .for-lewis folder (the dev server only); it is not saved with the game. Redo keeps a new one in the usual place.';
const FOLDER = '.for-lewis/research/archive-walks';
let rootCache: Promise<string | undefined> | undefined;

/** The repository root, from the list of folders Vite's 403 page says it serves. */
function repoRoot(): Promise<string | undefined> {
  rootCache ??= fetch('/@fs/etc/hosts')
    .then((r) => r.text())
    .then((t) => /serving allow list\.<br\/><br\/>- ([^<]+)</.exec(t)?.[1])
    .catch(() => undefined);
  return rootCache;
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');

/** A walkthrough on disk for this .gam (matched without case); `name` (the project's) picks among several zips. */
export async function localWalk(gam: string, sceneCount: number, name = ''): Promise<LocalWalk | undefined> {
  try {
    const root = await repoRoot();
    if (!root) return undefined;
    const base = `/@fs${root}/${FOLDER}`;
    const index = await fetch(`${base}/index.tsv`);
    if (!index.ok) return undefined;
    const rows = (await index.text())
      .split('\n')
      .slice(1)
      .map((l) => l.split('\t'))
      .filter((c) => c[1]?.toLowerCase() === gam.toLowerCase());
    const mine = slug(name);
    rows.sort((a, b) => Number(mine.includes(slug(b[0].replace(/^game-maker_/, '')))) - Number(mine.includes(slug(a[0].replace(/^game-maker_/, '')))));
    for (const [zip, file] of rows) {
      const r = await fetch(`${base}/${zip}/${file}.walkthrough.json`);
      if (!r.ok) continue;
      const checked = checkWalkFile(await r.text(), gam, sceneCount);
      if (checked.ok) return { walk: checked.walk, note: NOTE };
    }
  } catch {
    // no folder, no network: no local walkthrough
  }
  return undefined;
}

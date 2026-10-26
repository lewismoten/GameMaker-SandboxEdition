// Checks the save signs (saveSign.ts) on the built disks: every game with a felt egg (about.json
// "egg") has exactly one, where its about.json "saveSign" says ({ map, at, after, planes? }), and `after`
// (the map the egg is on) is that map or links straight to it; no other game has one. Secret
// games are left out unless named. Run from web/:
//
//   npx vite-node ../games/kit/saveSignCheck.ts [<id>...]
//
// Exits 1 on any problem.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gameDisk, gamesDir } from './tinHeartDisk';
import { looksLikeSaveSign } from './saveSign';
import { BACKBL, parseBlocks } from '../../web/src/formats/blocks';
import { MLEN, MWID, parseMap } from '../../web/src/formats/map';

interface About {
  secret?: boolean;
  egg?: { block?: number; counter?: number };
  /** `planes`: the same level's other map files (Depth Perception's far plane), where the same cell is the same sign. */
  saveSign?: { map: string; at: [number, number]; after: string; planes?: string[] };
}

/** Every save sign on a game's disk, as "map@x,y" (the board's left block). */
export function findSaveSigns(id: string): string[] {
  const { disk, game } = gameDisk(id);
  const found = new Set<string>();
  let pal: Uint8Array | undefined;
  let bbl: string | undefined;
  for (const s of game.scenes) {
    const p = s.files[0]?.toLowerCase();
    if (p && disk.get(p)) pal = disk.get(p);
    const b = s.files[2]?.toLowerCase();
    if (b && disk.get(b)) bbl = b;
    const map = s.files[1]?.toLowerCase();
    const mapBytes = map && disk.get(map);
    if (!mapBytes || !pal || !bbl) continue;
    const blocks = parseBlocks(disk.get(bbl)!, BACKBL);
    const cells = parseMap(mapBytes).blocks;
    const memo = new Map<number, boolean>();
    for (let y = 0; y < MWID; y++)
      for (let x = 0; x + 1 < MLEN; x++) {
        const l = cells[y * MLEN + x];
        const r = cells[y * MLEN + x + 1];
        const key = l * 256 + r;
        if (!memo.has(key)) memo.set(key, !!blocks[l] && !!blocks[r] && looksLikeSaveSign(blocks[l].pixels, blocks[r].pixels, pal));
        if (memo.get(key)) found.add(`${map}@${x},${y}`);
      }
  }
  return [...found].sort();
}

/** What is wrong with a game's save sign, or [] when it is right. */
export function saveSignProblems(id: string): string[] {
  const about = JSON.parse(readFileSync(join(gamesDir, id, 'about.json'), 'utf8')) as About;
  const planes = new Set(about.saveSign?.planes ?? []);
  const at = about.saveSign?.at.join(',');
  const signs = findSaveSigns(id).filter((s) => !(planes.has(s.split('@')[0]) && s.endsWith(`@${at}`)));
  if (!about.egg) return signs.length ? [`has a save sign but no felt egg: ${signs.join(' ')}`] : [];
  const want = about.saveSign;
  if (!want) return [`has a felt egg but about.json has no "saveSign" (found: ${signs.join(' ') || 'none'})`];
  const here = `${want.map}@${want.at.join(',')}`;
  const problems: string[] = [];
  if (!signs.includes(here)) problems.push(`no save sign at ${here} (found: ${signs.join(' ') || 'none'})`);
  if (signs.length !== 1) problems.push(`${signs.length} save signs (want 1): ${signs.join(' ')}`);
  const { disk, game } = gameDisk(id);
  // the egg's map, when the egg is a block on a map from the start
  if (about.egg.block !== undefined) {
    const eggMaps = [...disk.keys()].filter((n) => n.endsWith('.map') && parseMap(disk.get(n)!).blocks.includes(about.egg!.block!));
    if (eggMaps.length && !eggMaps.includes(want.after)) problems.push(`"after" is ${want.after}, but the egg is on ${eggMaps.join(', ')}`);
  }
  if (want.after !== want.map) {
    const onMap = (m: string) => new Set(game.scenes.flatMap((s, i) => (s.files[1]?.toLowerCase() === m ? [i] : [])));
    const from = onMap(want.after);
    const to = onMap(want.map);
    const linked = game.scenes.some((s, i) => from.has(i) && s.links.slice(0, s.numLinks).some((l) => to.has(l.toScene)));
    if (!linked) problems.push(`no scene on ${want.after} links to ${want.map}`);
  }
  return problems;
}

if (!process.env.VITEST) {
  const named = process.argv.slice(2);
  const ids = named.length
    ? named
    : readdirSync(gamesDir)
        .sort()
        .filter((id) => existsSync(join(gamesDir, id, 'about.json')) && existsSync(join(gamesDir, id, 'disk')))
        .filter((id) => !(JSON.parse(readFileSync(join(gamesDir, id, 'about.json'), 'utf8')) as About).secret);
  let bad = 0;
  for (const id of ids) {
    const p = saveSignProblems(id);
    if (p.length) bad++;
    console.log(`${id.padEnd(10)} ${p.length ? 'FAIL ' + p.join('; ') : 'ok'}`);
  }
  process.exit(bad ? 1 : 0);
}

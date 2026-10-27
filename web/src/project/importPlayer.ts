// An imported game folder's own player: when its .EXE is a hand-edited XFERPLAY 3.00 (as Builder's
// and Rōdïp's were), its changes are read into DOS player patches (dosPlayer/), so the editor's
// panel, Play and the DOS export keep them. A player that asks for other file extensions (Acord
// Games' .z0g, .z0n…, renamed so Game-Maker could not open the games) has its files renamed back:
// the extensions the .EXE names, then the rest by the slot each fills in the .gam, rewriting the
// names inside the .gam, slide lists and backdrops in place (same length, extensionNames.ts).
// The extensions become the project's DOS player patches too, so its DOS export renames them again.
import { normalize, type GameFiles } from './files';
import { parseGame, ADV_EXTS } from '../formats/game';
import { md5Hex } from '../dosPlayer/md5';
import { readPlayerPatches, STOCK_PLAYER_MD5 } from '../dosPlayer/applyPatches';
import { EXT_KINDS, extId, extensionClashes, extValueProblem, renamedExtensions, withoutExtensions } from '../dosPlayer/fileExtensions';
import { rewriteNames } from './extensionNames';
import type { PlayerPatches } from '../dosPlayer/patchRules';

export interface ImportedPlayer {
  /** The .EXE it came from. */
  exe: string;
  patches: PlayerPatches;
  /** What was found, for a toast. */
  message: string;
}

const PLAYER_SIZE = 160_598;
const extOf = (n: string) => (/\.([^.]*)$/.exec(n)?.[1] ?? '').toLowerCase();
const stemOf = (n: string) => normalize(n).replace(/\.[^.]*$/, '');

/** What each scene slot holds, when its extension doesn't say (songs, a level's data files, the demo). */
function slotExt(scene: number, slot: number): string | undefined {
  if (scene === 0) return slot === 1 || slot === 3 || slot === 5 ? 'cmf' : slot === 11 ? 'rec' : undefined;
  if (scene === 1) return slot === 1 || slot === 3 ? 'cmf' : undefined;
  return slot < 9 ? ADV_EXTS[slot] : undefined;
}

const KNOWN = new Set(['gam', 'pal', 'map', 'bbl', 'mon', 'mbl', 'chr', 'cbl', 'snd', 'cmf', 'gif', 'bkd', 'fli', 'txt', 'lst', 'voc', 'rec', 'his', 'sav']);

/**
 * Whether `bytes` can be a file of extension `ext`, for the kinds that say so in their first
 * bytes. Acord's folders also hold other programs' data under the same renamed extensions (3D
 * Construction Kit worlds as .z0p beside the games' FLIs), which keep their names.
 */
function fits(ext: string, bytes: Uint8Array): boolean {
  if (ext === 'fli') return bytes.length >= 6 && bytes[5] === 0xaf && (bytes[4] === 0x11 || bytes[4] === 0x12);
  if (ext === 'gif') return bytes.length >= 4 && String.fromCharCode(...bytes.subarray(0, 4)) === 'GIF8';
  return true;
}

/** Renames a renamed-extension game's files back (in place); returns the extension map used. */
function renameBack(files: GameFiles, exeExt: Record<string, string>): Map<string, string> {
  const map = new Map<string, string>(); // renamed ext -> Game-Maker's
  for (const [stock, now] of Object.entries(exeExt)) if (now) map.set(now.slice(1), stock.slice(1));
  // a blanked .gam extension (Virtual Mario's): the game file has none
  const blankGam = exeExt['.gam'] === '';
  const gams = files.names().filter((n) => map.get(extOf(n)) === 'gam' || (blankGam && !n.includes('.')));
  // every other extension by the slot it fills, when all its uses agree
  const votes = new Map<string, Set<string>>();
  for (const g of gams) {
    try {
      parseGame(files.get(g)!).scenes.forEach((s, i) =>
        s.files.forEach((f, k) => {
          const e = extOf(f);
          const want = slotExt(i, k);
          if (f && want && !KNOWN.has(e) && !map.has(e)) (votes.get(e) ?? votes.set(e, new Set()).get(e)!).add(want);
        }),
      );
    } catch {
      /* not a .gam after all */
    }
  }
  for (const [e, wants] of votes) if (wants.size === 1) map.set(e, [...wants][0]);
  const renames = new Map<string, string>();
  for (const n of files.names()) {
    const e = extOf(n);
    const to = map.get(e) ?? (blankGam && gams.includes(n) ? 'gam' : undefined);
    if (to && fits(to, files.get(n)!)) renames.set(n, e ? `${n.slice(0, -e.length)}${to}` : `${n}.gam`);
  }
  for (const [from, to] of renames) {
    const bytes = files.get(from)!;
    files.delete(from);
    files.set(to, bytes);
  }
  // the names inside the .gam, slide lists and backdrops (also of files the folder lacks)
  for (const n of files.names()) if (/\.(gam|lst|bkd)$/.test(n)) files.set(n, rewriteNames(files.get(n)!, map));
  return map;
}

/**
 * Reads the player .EXE among an imported folder's files (`players`: the .EXEs the import
 * otherwise leaves out) into patches, renaming the game's files back if it renamed their
 * extensions. Undefined when there is none, or it is the CD's own.
 */
export function adoptPlayer(files: GameFiles, players: { name: string; bytes: Uint8Array }[]): ImportedPlayer | undefined {
  const candidates = players.filter((p) => p.bytes.length === PLAYER_SIZE);
  if (!candidates.length) return undefined;
  // the one named after a game file (TRANSFER names the player after the .gam)
  const stems = new Set(files.names().map(stemOf));
  const exe = candidates.find((p) => stems.has(stemOf(p.name))) ?? candidates[0];
  if (md5Hex(exe.bytes) === STOCK_PLAYER_MD5) return undefined;
  const read = readPlayerPatches(exe.bytes);
  if (!read) return undefined;
  const exeExt = renamedExtensions(exe.bytes);
  const name = exe.name.replace(/^.*[\\/]/, '').toUpperCase();
  const said: string[] = [];
  const n = Object.keys(withoutExtensions(read.patches)).length;
  if (n)
    said.push(`${name} is a hand-edited Game-Maker player: ${n} change${n === 1 ? '' : 's'} to its words, colors or timings are in the DOS player panel now.`);
  let patches = read.patches;
  if (Object.keys(exeExt).length) {
    const map = renameBack(files, exeExt);
    const shown = Object.values(exeExt).filter(Boolean).slice(0, 2);
    // the kinds the .gam names (the .EXE's own are read with its other patches)
    const kept: PlayerPatches = { ...patches };
    for (const [now, stock] of map) {
      const k = EXT_KINDS.find((e) => e.ext === stock && !e.offsets.length);
      if (k && !extValueProblem(k.ext, now)) kept[extId(k.ext)] = now;
    }
    patches = extensionClashes(kept).size ? withoutExtensions(kept) : kept;
    const carried = Object.keys(patches).length > Object.keys(withoutExtensions(patches)).length;
    said.push(
      `${name} was changed to look for its files under other extensions (${shown.join(', ')}…). Their ${map.size} kinds of file are renamed back to Game-Maker’s own, so they open here.${
        carried ? ' The DOS player panel’s Files tab keeps their extensions, so the DOS download renames them again.' : ''
      }`,
    );
  }
  if (!read.explained) said.push(`Its other changes (such as an About page of its own) aren’t carried over.`);
  if (!said.length) return undefined;
  return { exe: name, patches, message: said.join(' ') };
}

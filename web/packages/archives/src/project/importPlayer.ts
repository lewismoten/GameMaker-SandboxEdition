// An imported game folder's own player: which Game-Maker build it is (player/playerBuild.ts), and
// when it is a hand-edited one (as Builder's and Rōdïp's XFERPLAY 3.00 were), its changes are read
// into DOS player patches (dosPlayer/), so the editor's panel, Play and the DOS export keep them;
// changes that are no setting (an About page of its own) are kept raw (player/playerPreserve.ts). A player that asks for other file extensions (Acord
// Games' .z0g, .z0n…, renamed so Game-Maker could not open the games) has its files renamed back:
// the extensions the .EXE names, then the rest by the slot each fills in the .gam, rewriting the
// names inside the .gam, slide lists and backdrops in place (same length, extensionNames.ts).
// The extensions become the project's DOS player patches too, so its DOS export renames them again.
import { normalize, type GameFiles } from '@lewismoten/gamemaker-sandbox-engine/core/gameFiles';
import { parseGame, ADV_EXTS } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { md5Hex } from '../player/md5';
import { aboutChanged, aboutLines, buildData, changedBlocks, identifyPlayer, type PlayerIdentity } from '../player/playerBuild';
import { preservePlayer } from '../player/playerPreserve';
import type { PreservedRegion } from '../player/preservedRegions';
import {
  EXT_KINDS,
  extId,
  extKind,
  extensionClashes,
  extValueProblem,
  renamedExtensions,
  withoutExtensions,
} from '@lewismoten/gamemaker-sandbox-engine/player/fileExtensions';
import { rewriteNames } from './extensionNames';
import type { PlayerPatches } from '@lewismoten/gamemaker-sandbox-engine/player/patchRules';

// what the editor shows of an imported player (its Player entry and DOS player panel)
export { aboutLines, buildData, buildLabel, estimateFromFolder, identifyPlayer, type FolderEstimate, type PlayerIdentity } from '../player/playerBuild';
export { BLOCK, BUILD_DATA, type BuildData } from '../player/playerBuildData';
export { preservePlayer } from '../player/playerPreserve';
export { regionText, type PreservedRegion } from '../player/preservedRegions';

/** Where an imported game's player came from and what its author changed (the companion's record). */
export interface PlayerOrigin extends PlayerIdentity {
  /** The .EXE it came from. */
  exe: string;
  size: number;
  md5: string;
  /** The About page's lines when its author changed them (read-only: RSD's or the author's attribution). */
  about?: string[];
  /** Changed bytes no DOS player setting explains (an owner field never among them). */
  regions: PreservedRegion[];
  /** The settings read from it at import, so the DOS export can tell the project author's later changes. */
  importPatches: PlayerPatches;
}

export interface ImportedPlayer {
  /** The .EXE it came from. */
  exe: string;
  patches: PlayerPatches;
  /** What was found, for a toast ('' when there's nothing to say, as for a stock player). */
  message: string;
  origin: PlayerOrigin;
}

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

/** A known build's renamed extensions as renamedExtensions gives them ('.gam' -> '.z0g'). */
const extMap = (patches: PlayerPatches) =>
  Object.fromEntries(
    Object.entries(patches)
      .filter(([id]) => extKind(id))
      .map(([id, v]) => [`.${extKind(id)!.ext}`, `.${v as string}`]),
  );

/**
 * Reads the player .EXE among an imported folder's files (`players`: the .EXEs the import
 * otherwise leaves out): which Game-Maker build it is, its settings as DOS player patches (an
 * older build's by 3.00's patch ids), and its other changed bytes, kept as they were; renames the
 * game's files back if it renamed their extensions. Undefined when there is no player.
 */
export function adoptPlayer(files: GameFiles, players: { name: string; bytes: Uint8Array }[]): ImportedPlayer | undefined {
  if (!players.length) return undefined;
  const ids = players.map((p) => ({ p, id: identifyPlayer(p.bytes) }));
  const known = ids.filter((x) => x.id.build !== 'unknown');
  // the one named after a game file (TRANSFER names the player after the .gam), 3.00's first
  const stems = new Set(files.names().map(stemOf));
  const rank = (x: (typeof ids)[number]) => (stems.has(stemOf(x.p.name)) ? 0 : 2) + (x.id.build === '3.00' ? 0 : 1);
  const pick = [...(known.length ? known : ids)].sort((a, b) => rank(a) - rank(b))[0];
  // an .EXE of no known build and no version line may be any program (a setup, a compressed player)
  if (!known.length && !pick.id.versionLine) return undefined;
  const exe = pick.p;
  const name = exe.name.replace(/^.*[\\/]/, '').toUpperCase();
  const b = buildData(pick.id.build);
  const kept = b && !pick.id.stock && b.id !== '3.00-playgame' ? preservePlayer(exe.bytes, b) : { patches: {}, regions: [] };
  const blocks = b && !pick.id.stock ? changedBlocks(exe.bytes, b) : [];
  const origin: PlayerOrigin = {
    ...pick.id,
    exe: name,
    size: exe.bytes.length,
    md5: md5Hex(exe.bytes),
    regions: kept.regions,
    importPatches: kept.patches,
    ...(b && aboutChanged(b, blocks) ? { about: aboutLines(exe.bytes, b) } : {}),
  };
  if (pick.id.stock || !b) return { exe: name, patches: {}, message: '', origin };
  const said: string[] = [];
  const old = b.id !== '3.00' ? ` (Game-Maker ${b.id}’s, read by its 3.00 equivalents)` : '';
  const n = Object.keys(withoutExtensions(kept.patches)).length;
  if (n)
    said.push(
      `${name} is a hand-edited Game-Maker player: ${n} change${n === 1 ? '' : 's'} to its words, colors or timings${old} are in the DOS player panel now.`,
    );
  let patches = kept.patches;
  const exeExt = b.id === '3.00' ? renamedExtensions(exe.bytes) : extMap(kept.patches);
  if (Object.keys(exeExt).length) {
    const map = renameBack(files, exeExt);
    const shown = Object.values(exeExt).filter(Boolean).slice(0, 2);
    // the kinds the .gam names (the .EXE's own are read with its other patches)
    const withGam: PlayerPatches = { ...patches };
    for (const [now, stock] of map) {
      const k = EXT_KINDS.find((e) => e.ext === stock && !e.offsets.length);
      if (k && !extValueProblem(k.ext, now)) withGam[extId(k.ext)] = now;
    }
    patches = extensionClashes(withGam).size ? withoutExtensions(withGam) : withGam;
    const carried = Object.keys(patches).length > Object.keys(withoutExtensions(patches)).length;
    said.push(
      `${name} was changed to look for its files under other extensions (${shown.join(', ')}…). Their ${map.size} kinds of file are renamed back to Game-Maker’s own, so they open here.${
        carried ? ' The DOS player panel’s Files tab keeps their extensions, so the DOS download renames them again.' : ''
      }`,
    );
  }
  if (kept.regions.length)
    said.push(
      b.id === '3.00'
        ? `Its other changes (such as an About page of its own) are kept as they were: the project’s Player file shows them, and the DOS download writes them back.`
        : `Its other changes (such as an About page of its own) are kept read-only in the project’s Player file; the DOS download uses Game-Maker 3.00’s player, so they aren’t in it.`,
    );
  return { exe: name, patches, message: said.join(' '), origin };
}

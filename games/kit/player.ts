// A game's DOS player look: games/<id>/player.json, the { base, patches } record a project keeps
// in its companion's "dosPlayer" section (web/src/dosPlayer/playerRecord.ts). The site's Play,
// demos, walkthrough, downloads, the desk and the editor show it (web/src/dosPlayer/
// catalogPatches.ts); the DOS download writes it into its XFERPLAY.EXE. It never goes on disk/.
// playerProblems says what in one breaks a rule: the patch table's own (web/src/dosPlayer/
// patchRules.ts), and this project's for its games: words, colors, frames and positions only (a
// timing or a switched-off F-key would change how the game plays, and the bots and walkthroughs
// play without the look), the files keep their extensions, and the words a patch recolors on the
// player's black screens stay readable in every level's palette.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isStock, patchEntry, patchProblem, type PatchValue, type PlayerPatches } from '../../web/src/dosPlayer/patchRules';
import { extKind } from '../../web/src/dosPlayer/fileExtensions';
import { applyPlayerPatches } from '../../web/src/dosPlayer/applyPatches';
import { playerLook } from '../../web/src/engine/playerLook';
import { parseGame } from '../../web/src/formats/game';
import { parsePalette } from '../../web/src/formats/palette';
import { sceneFile } from '../../web/src/engine/scene';
import { contrastRatio, luminance } from '../../web/src/editor/check/sceneData';
import { readDisk } from './gameSim';

const gamesDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const STOCK_PLAYER = join(gamesDir, '../cd/gm/xferplay.exe');
const BASE = 'xferplay-3.00';

export const playerPath = (id: string): string => join(gamesDir, id, 'player.json');

/** The game's patches (none without a player.json). Throws when it can't be read as a record. */
export function readPlayer(id: string): PlayerPatches {
  const path = playerPath(id);
  if (!existsSync(path)) return {};
  const r = JSON.parse(readFileSync(path, 'utf8')) as { base?: unknown; patches?: unknown };
  if (r.base !== BASE || !r.patches || typeof r.patches !== 'object')
    throw new Error(`${id}/player.json: not a { "base": "${BASE}", "patches": { … } } record`);
  return r.patches as PlayerPatches;
}

/** The color selectors of the screens the player clears to color 0 (code/GM/PLAYGAME.C) and the level's palette is up. */
const BLACK_SCREENS = [
  'color.select.status',
  'color.select.dropFrame',
  'color.select.dropCursor',
  'color.select.helpNone',
  'color.select.aboutFrame',
  'color.select.aboutText',
  'color.select.joyText',
  'color.select.hsPrompt',
  'color.select.hsName',
];

/** The least contrast its words may have against color 0 (WCAG's floor for large text; the font is 8 × 8). */
const MIN_RATIO = 3;

/** Each level's palette that isn't all dark (a fade's), by file name. */
function levelPalettes(id: string): [string, Uint8Array][] {
  const disk = readDisk(join(gamesDir, id, 'disk'));
  const gamName = [...disk.keys()].find((n) => /\.gam$/i.test(n));
  if (!gamName) return [];
  const game = parseGame(disk.get(gamName)!);
  const out = new Map<string, Uint8Array>();
  for (let n = 2; n < game.scenes.length; n++) {
    const f = sceneFile(game, n, 0);
    const bytes = f ? disk.get(f.toLowerCase()) : undefined;
    if (!f || !bytes || out.has(f.toLowerCase())) continue;
    const pal = parsePalette(bytes);
    if (pal.some((v) => v > 12)) out.set(f.toLowerCase(), pal);
  }
  return [...out];
}

/**
 * What in a set of patches breaks a rule: unknown, against the patch table's rules, the CD
 * player's own value, a timing, a switched-off key or a renamed extension; the patched .EXE
 * when it can't be written; and a color it changes on the black screens that stands under
 * MIN_RATIO against color 0 in one of `palettes` (each level's, by file name).
 */
export function ruleProblems(patches: Record<string, unknown>, palettes: [string, Uint8Array][] = []): string[] {
  const out: string[] = [];
  for (const [pid, v] of Object.entries(patches)) {
    if (extKind(pid)) {
      out.push(`${pid}: the game's files keep their extensions`);
      continue;
    }
    const e = patchEntry(pid);
    if (!e) {
      out.push(`${pid}: no such patch`);
      continue;
    }
    const problem = patchProblem(e, v);
    if (problem) out.push(`${pid} (${e.label}): ${problem}`);
    else if (isStock(e, v as PatchValue)) out.push(`${pid} (${e.label}): the CD player's own value (leave it out)`);
    if (e.group === 'times' || e.group === 'keys')
      out.push(`${pid} (${e.label}): a ${e.group === 'times' ? 'timing' : 'switched-off key'} would change how the game plays`);
  }
  if (out.length) return out;
  const valid = patches as PlayerPatches;
  if (existsSync(STOCK_PLAYER)) {
    try {
      applyPlayerPatches(new Uint8Array(readFileSync(STOCK_PLAYER)), valid);
    } catch (e) {
      out.push(`XFERPLAY.EXE: ${(e as Error).message}`);
    }
  }
  // a color this changes, on the black screens: readable in every level's palette
  const look = playerLook(valid);
  const target = (sel: string) => String(valid[sel] ?? patchEntry(sel)!.stock);
  const touched = (sel: string) => sel in valid || `color.rgb.${target(sel)}` in valid;
  for (const sel of BLACK_SCREENS.filter(touched))
    for (const [file, pal] of palettes) {
      const c = look.color(pal, sel);
      const ratio = contrastRatio(luminance(pal, c), luminance(pal, 0));
      if (ratio < MIN_RATIO) out.push(`${sel}: color ${c} of ${file} stands ${ratio.toFixed(1)} : 1 against color 0 (${MIN_RATIO} : 1 or more)`);
    }
  return out;
}

/** What in games/<id>/player.json breaks a rule (none without one). */
export function playerProblems(id: string): string[] {
  try {
    return ruleProblems(readPlayer(id), levelPalettes(id));
  } catch (e) {
    return [(e as Error).message];
  }
}

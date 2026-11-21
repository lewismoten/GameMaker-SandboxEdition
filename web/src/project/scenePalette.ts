// The palette a file is shown with, from the game's scenes: one pure function the editor's Project and the
// Assistant's render tools (and the MCP server) share, so all of them see the same picture.
import { normalize, type GameFiles } from './files';
import type { Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { defaultPalette, parsePalette, type Palette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import { decodeGif, isGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { isSolidPalette, mostReadable } from '../editor/core/readablePalette';

/** Block sets used with this map in scene order, including blank slots carried between levels. */
export function mapBlockSets(game: Game, file: string): string[] {
  const want = normalize(file);
  const sets = new Set<string>();
  let map = '';
  let blocks = '';
  for (const scene of game.scenes) {
    if (scene.gametype !== 10) continue;
    map = scene.files[1] || map;
    blocks = scene.files[2] || blocks;
    if (blocks && normalize(map) === want) sets.add(blocks);
  }
  return [...sets];
}

/** Level file slots carry forward across level scenes, as in PLAYGAME. */
export function* levelFiles(game: Game) {
  const held: string[] = [];
  for (const scene of game.scenes) {
    if (scene.gametype !== 10) continue;
    scene.files.forEach((file, slot) => {
      if (file) held[slot] = file;
    });
    yield { scene, files: held.slice() };
  }
}

/** The palette most scenes using `file` use (a blank slot inherits the level before), else the most-used non-solid .pal, else a GIF's, else the default. */
export function scenePalette(files: GameFiles, game: Game, file: string, used?: ArrayLike<number>): { palette: Palette; source: string } {
  // several scenes may use one file with different palettes: the palette most of them use wins, the first on a tie
  const tally = new Map<string, { n: number; name: string }>();
  // a slot left blank keeps the file of the level scene before it (loadscene's globals), so a scene counts as using what it inherits
  const want = normalize(file);
  const counts = new Map<string, number>();
  for (const scene of game.scenes) {
    if (scene.gametype === 10 || !scene.files[0]) continue;
    const pal = normalize(scene.files[0]);
    counts.set(pal, (counts.get(pal) ?? 0) + 1);
  }
  for (const { files: held } of levelFiles(game)) {
    const pal = held[0];
    if (pal) counts.set(normalize(pal), (counts.get(normalize(pal)) ?? 0) + 1);
    if (!want || !pal || !files.has(pal) || !held.some((f) => f && normalize(f) === want)) continue;
    const hit = tally.get(normalize(pal));
    if (hit) hit.n++;
    else tally.set(normalize(pal), { n: 1, name: pal });
  }
  if (tally.size) {
    const ranked = [...tally.values()].sort((a, b) => b.n - a.n); // stable: the first scene breaks a tie
    // with the sprite's colors known, skip a scene palette that would show it dark on dark
    const i = used
      ? mostReadable(
          ranked.map((t) => files.get(t.name)!),
          used,
        )
      : 0;
    return { palette: parsePalette(files.get(ranked[i].name)!), source: ranked[i].name };
  }
  // no scene uses the file: the palette the scenes use most (below)
  let pals = files.byExtension('pal');
  if (pals.length) {
    // a palette that is one solid color stands for nothing: use the others, the one the scenes use most first
    const usable = pals.filter((p) => !isSolidPalette(files.get(p)!));
    if (usable.length) {
      const uses = (p: string) => counts.get(normalize(p)) ?? 0;
      pals = usable
        .map((p, i) => ({ p, i }))
        .sort((a, b) => uses(b.p) - uses(a.p) || a.i - b.i)
        .map((x) => x.p);
    }
    // with the sprite's colors known, skip a palette that would show it dark on dark
    const i = used
      ? mostReadable(
          pals.map((p) => files.get(p)!),
          used,
        )
      : 0;
    return { palette: parsePalette(files.get(pals[i])!), source: pals[i] };
  }
  for (const g of files.byExtension('gif')) {
    const b = files.get(g)!;
    if (isGif(b)) {
      try {
        return { palette: decodeGif(b).palette, source: g };
      } catch {
        /* try the next one */
      }
    }
  }
  return { palette: defaultPalette(), source: 'default' };
}

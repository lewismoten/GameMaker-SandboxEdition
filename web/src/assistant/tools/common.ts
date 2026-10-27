// What the tools share: reading the game and its files with a clear error when one is missing,
// the schema pieces most tools take, and the palette a file is shown with.
import { normalize } from '../../project/files';
import { ADVTYPE, parseGame, type Game } from '../../formats/game';
import { defaultPalette, parsePalette, type Palette } from '../../formats/palette';
import { decodeGif, isGif } from '../../formats/gif';
import { ToolError, type GameContext, type JsonSchema } from './types';

export const FILE: JsonSchema = { type: 'string', description: 'A file name in the game, e.g. level1.map.' };
export const SCENE: JsonSchema = { type: 'integer', minimum: 0, description: 'Scene number (0 title, 1 game over, 2+ levels).' };
export const int = (description: string, minimum?: number, maximum?: number): JsonSchema => ({
  type: 'integer',
  description,
  ...(minimum === undefined ? {} : { minimum }),
  ...(maximum === undefined ? {} : { maximum }),
});
export const intRows = (description: string, maxItems = 100): JsonSchema => ({
  type: 'array',
  description,
  maxItems,
  items: { type: 'array', items: { type: 'integer', minimum: 0, maximum: 255 } },
});

export function gameOf(ctx: GameContext): Game {
  const bytes = ctx.files.get(ctx.gam);
  if (!bytes) throw new ToolError(`The game file ${ctx.gam} is missing.`);
  return parseGame(bytes);
}

/** A file's bytes; throws a tool error naming it when it is not there. */
export function need(ctx: GameContext, name: unknown, ext?: string): Uint8Array {
  const n = fileName(name, ext);
  const b = ctx.files.get(n);
  if (!b) throw new ToolError(`There is no file ${n} in this game.`);
  return b;
}

/** A file name argument as stored (lower case 8.3), checked for its extension. */
export function fileName(name: unknown, ext?: string): string {
  if (typeof name !== 'string' || !name.trim()) throw new ToolError('A file name is needed.');
  const n = normalize(name);
  if (ext && !n.endsWith(`.${ext}`)) throw new ToolError(`${n} is not a .${ext} file.`);
  if (!/^[a-z0-9_\-~!@#$%^&()]{1,8}\.[a-z0-9]{1,3}$/.test(n))
    throw new ToolError(`${n} is not a DOS file name (up to 8 letters or digits, a dot, up to 3 more).`);
  return n;
}

export function sceneOf(game: Game, n: unknown): Game['scenes'][number] {
  const s = typeof n === 'number' ? game.scenes[n] : undefined;
  if (!s) throw new ToolError(`There is no scene ${String(n)} (the game has ${game.scenes.length}, 0 to ${game.scenes.length - 1}).`);
  return s;
}

/** The palette a file is shown with: the first level scene using it (or its block set or map), else the first .pal, else a GIF's, else the default. */
export function paletteFor(ctx: GameContext, file?: string): Palette {
  const n = file ? normalize(file) : '';
  try {
    const game = gameOf(ctx);
    for (const s of game.scenes)
      if (s.gametype === ADVTYPE && s.files[0] && s.files.some((f) => f && normalize(f) === n)) {
        const p = ctx.files.get(s.files[0]);
        if (p) return parsePalette(p);
      }
  } catch {
    /* no game: the first palette there is */
  }
  const pal = ctx.files.byExtension('pal')[0];
  if (pal) return parsePalette(ctx.files.get(pal)!);
  for (const g of ctx.files.byExtension('gif')) {
    const b = ctx.files.get(g)!;
    if (isGif(b))
      try {
        return decodeGif(b).palette;
      } catch {
        /* the next */
      }
  }
  return defaultPalette();
}

/** Keeps an integer argument in range (with a default). */
export function clampInt(v: unknown, lo: number, hi: number, fallback: number): number {
  const n = typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : fallback;
  return Math.max(lo, Math.min(hi, n));
}

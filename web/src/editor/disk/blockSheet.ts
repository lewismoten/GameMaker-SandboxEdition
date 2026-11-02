// A block file's sheet as a picture: every block of the file in a grid of 15 columns (slot order, so a
// merge's moved blocks can be found), drawn in the palette of the first scene that opens the file.
import { BACKBL, CHARBL, MONBL, parseBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import type { LevelPicture } from '../../gfx/levelPicture';
import type { GameFiles } from '../../project/files';
import { sceneUses, type SceneUse } from './refs';

const COLS = 15;
const COUNT = { bbl: BACKBL, mbl: MONBL, cbl: CHARBL } as const;
export type SheetKind = keyof typeof COUNT;

/** The extension of a block file name if it is one. */
export const sheetKind = (name: string): SheetKind | undefined => {
  const e = name.slice(name.lastIndexOf('.') + 1).toLowerCase();
  return e in COUNT ? (e as SheetKind) : undefined;
};

/** The sheet of `name` in `files`, or undefined when the file or a scene palette to draw it with is missing. */
export function blockSheet(files: GameFiles, gam: string, name: string): LevelPicture | undefined {
  const kind = sheetKind(name);
  const bytes = files.get(name);
  if (!kind || !bytes) return undefined;
  let use: SceneUse | undefined;
  try {
    use = sceneUses(files, parseGame(files.get(gam)!)).find((u) => u[kind] === name && u.pal);
  } catch {
    return undefined;
  }
  const palette = use?.pal ? files.get(use.pal) : undefined;
  if (!palette) return undefined;
  const n = COUNT[kind];
  const blocks = parseBlocks(bytes.subarray(0, n * 420), n);
  const rows = Math.ceil(n / COLS);
  const width = COLS * 20;
  const pixels = new Uint8Array(width * rows * 20);
  blocks.forEach((b, i) => {
    const [bx, by] = [(i % COLS) * 20, Math.floor(i / COLS) * 20];
    for (let y = 0; y < 20; y++) pixels.set(b.pixels.subarray(y * 20, y * 20 + 20), (by + y) * width + bx);
  });
  return { width, height: rows * 20, pixels, palette };
}

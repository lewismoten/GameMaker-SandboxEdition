// Reusable one-frame micro plaques: palette-independent boards and sky-matched posts.
import {
  buildTiledSigns,
  stampTiledSign as stampSign,
  stampMicroPlaques as stampStack,
  type TiledSign,
} from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';
import { PULL, type Book } from './book';
import { skyOf, type Pal } from './palette';

export interface MicroPlaqueText {
  /** One or two explicit lines; four characters per block, without splitting words. */
  lines: readonly string[];
  /** False for a floating plaque. Mounts more than one block from ground float by default. */
  post?: boolean;
}

/** Add a shared vocabulary once per book. Boards contain no scene-background pixels. */
export function addMicroPlaques<K extends string>(book: Book, pal: Pal, texts: Record<K, MicroPlaqueText>): Record<K, TiledSign> {
  for (const [name, plaque] of Object.entries<MicroPlaqueText>(texts))
    if (plaque.lines.length < 1 || plaque.lines.length > 2 || plaque.lines.some((line) => line.trim().length > 8))
      throw new Error(`Plaque ${name} needs one or two lines of at most eight characters`);
  const { blocks, signs } = buildTiledSigns(
    Object.fromEntries(
      Object.entries<MicroPlaqueText>(texts).map(([name, text]) => [name, { rows: text.lines.map((line) => [line]), post: text.post }]),
    ) as Record<K, { rows: string[][]; post?: boolean }>,
    {
      font: 'micro',
      maxWidth: 2,
      prefix: 'microPlaque',
      maxBlocks: Math.min(100, 150 - book.index.size),
      colors: {
        background: skyOf(pal),
        paper: pal.c('parch', 3),
        ink: pal.c('ink', 0),
        wood: pal.c('wood', 2),
        highlight: pal.c('wood', 4),
        shadow: pal.c('wood', 0),
      },
    },
  );
  for (const [name, pic] of blocks) book.add(name, pic, { grav: PULL.down });
  return signs;
}

/** Mount distances are in 20-pixel blocks, measured from the board to its surface. */
interface PlaqueMountOptions {
  maxPostHeight?: number;
}

/** A distant plaque floats; never leave a shortened post hanging in midair. */
export function microPlaquePostHeight(postHeight: number, { maxPostHeight = 1 }: PlaqueMountOptions = {}): number {
  if (!Number.isInteger(postHeight) || postHeight < 0 || !Number.isInteger(maxPostHeight) || maxPostHeight < 0)
    throw new Error('Plaque post heights must be nonnegative integers');
  return postHeight <= maxPostHeight ? postHeight : 0;
}

/** Place a plaque with a short grounded post, or float it when the surface is farther away. */
export function stampTiledSign(
  map: { set(x: number, y: number, block: string): unknown },
  x: number,
  y: number,
  sign: TiledSign,
  postHeight = 1,
  options: PlaqueMountOptions = {},
): void {
  stampSign(map, x, y, sign, microPlaquePostHeight(postHeight, options));
}

/** Stack plaques with the same short-post rule, measuring from the bottom plaque. */
export function stampMicroPlaques(
  map: { set(x: number, y: number, block: string): unknown },
  x: number,
  y: number,
  plaques: readonly TiledSign[],
  postHeight = 1,
  options: PlaqueMountOptions = {},
): void {
  stampStack(map, x, y, plaques, microPlaquePostHeight(postHeight, options));
}

// Reusable one-frame micro plaques: palette-independent boards and sky-matched posts.
import { buildTiledSigns, type TiledSign } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';
import type { MicroGlyphs } from '@lewismoten/gamemaker-sandbox-tools/microFont';
import { PULL, type Book } from './book';
import { skyOf, type Pal } from './palette';

export interface MicroPlaqueText {
  /** One or two explicit lines; four characters per block, without splitting words. */
  lines: readonly string[];
  /** False for a floating plaque. Mounts more than one block from ground float by default. */
  post?: boolean;
}

/** Add a shared vocabulary once per book. Boards contain no scene-background pixels. */
export function addMicroPlaques<K extends string>(book: Book, pal: Pal, texts: Record<K, MicroPlaqueText>, glyphs?: MicroGlyphs): Record<K, TiledSign> {
  for (const [name, plaque] of Object.entries<MicroPlaqueText>(texts))
    if (plaque.lines.length < 1 || plaque.lines.length > 2 || plaque.lines.some((line) => line.trim().length > 8))
      throw new Error(`Plaque ${name} needs one or two lines of at most eight characters`);
  const { blocks, signs } = buildTiledSigns(
    Object.fromEntries(
      Object.entries<MicroPlaqueText>(texts).map(([name, text]) => [name, { rows: text.lines.map((line) => [line]), post: text.post }]),
    ) as Record<K, { rows: string[][]; post?: boolean }>,
    {
      font: 'micro',
      glyphs,
      maxWidth: 2,
      prefix: 'microPlaque',
      maxBlocks: Math.min(100, book.size - book.index.size),
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

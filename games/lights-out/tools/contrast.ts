// How readable the dark is: the contrast (WCAG's ratio of relative luminances, 1 to 21) between what a player must see and
// what it stands against, at every brightness step of the cave. Used by check.ts, which fails below the limits (contrastTable.ts
// prints the table).
import { buildHeroBlocks } from '../../kit/starter/hero';
import type { Pal } from '../../kit/starter/palette';
import { cavePalette } from '../src/palettes';

const lum = (pal: Pal, i: number): number => {
  const ch = [0, 1, 2].map((k) => {
    const v = (pal.pal[i * 3 + k] * 255) / 63 / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
};
/** WCAG contrast ratio between palette colors a and b. */
export const ratio = (pal: Pal, a: number, b: number): number => {
  const [x, y] = [lum(pal, a), lum(pal, b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

/** The least contrast a floor's top edge may have with the air above it, and Kit's body with the air behind him. */
export const MIN_PATH = 2;
export const MIN_KIT = 3;
/** The least share of Kit's colors that must reach MIN_KIT against the air at any shade. */
export const MIN_KIT_SHARE = 0.65;

export interface Row {
  shade: number;
  /** floor edge against the air above it */
  path: number;
  /** the share of Kit's pixels that stand out from the air at this shade by MIN_KIT, and the least among his body colors */
  kit: number;
  /** lit rock against the air beside it (the shape of a wall) */
  wall: number;
}

/** Contrast at each shade 0 to 4. */
export function contrastTable(pal: Pal = cavePalette()): Row[] {
  const a = pal.r('cair');
  const f = pal.r('cfloor');
  const r = pal.r('crock');
  const hero = buildHeroBlocks(pal);
  const seen = new Map<number, number>();
  for (const [name, pic] of hero.pics) {
    if (!/^stand|^walk|^jump/.test(name)) continue;
    for (const c of pic.px) if (c !== 255) seen.set(c, (seen.get(c) ?? 0) + 1);
  }
  const colors = [...seen]; // his outline is in: a dark outline reads against bright air as a light fill does against dark air
  const total = colors.reduce((n, [, k]) => n + k, 0);
  return [0, 1, 2, 3, 4].map((k) => ({
    shade: k,
    path: ratio(pal, f[k + 3], a[k]),
    kit: colors.filter(([c]) => ratio(pal, c, a[k]) >= MIN_KIT).reduce((n, [, q]) => n + q, 0) / total,
    wall: ratio(pal, r[k + 1], a[k]),
  }));
}

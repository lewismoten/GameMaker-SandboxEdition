// The preset picker's instrument pictures (web/src/editor/editors/music/presetIcons.ts) as
// 20x20 Game-Maker pictures in Tune-Up's palette: drawn as they are, letter for color, with
// their 1px dark outline. Background blocks have no see-through color, so a picture sits on a
// tile: its family's pale tile (the picker's look) for an instrument to pick up, inside a gold
// sparkle frame that nothing else in the game wears; scenery puts one on its own backdrop.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { presetRows } from '../../../../web/src/editor/editors/music/presetIcons';
import { presetById } from '../../../../web/src/audio/oplPresets';
import { P } from './pal';

/** A preset's picture over `back` (a 20x20 picture, or a color; 255 leaves it clear). */
export function iconPic(id: string, back: Pixels | number = 255): Pixels {
  const preset = presetById(id);
  if (!preset) throw new Error(`No preset ${id}`);
  const p = typeof back === 'number' ? new Pixels(20, 20, back) : new Pixels(20, 20).blit(back, 0, 0);
  presetRows(id, preset.group).forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch !== '.') p.set(x, y, P.c(`icon-${ch}`, 0));
    });
  });
  return p;
}

/** The family a preset belongs to. */
export const familyOf = (id: string): string => {
  const preset = presetById(id);
  if (!preset) throw new Error(`No preset ${id}`);
  return preset.group;
};

/**
 * An instrument to pick up: its picture on the family's pale tile, in a gold frame with a
 * glint that moves round it (k 0..3), so a lost instrument always looks like one.
 */
export function pickupPic(id: string, k = 0): Pixels {
  const fam = familyOf(id);
  const p = iconPic(id, P.c(`fam-${fam}`, 2));
  const gold = P.c('gold', 1);
  const shine = P.c('yellow', 3);
  p.frame(0, 0, 20, 20, gold);
  // the glint: two bright pixels walking round the frame
  const ring: [number, number][] = [];
  for (let i = 0; i < 19; i++) ring.push([i, 0]);
  for (let i = 0; i < 19; i++) ring.push([19, i]);
  for (let i = 19; i > 0; i--) ring.push([i, 19]);
  for (let i = 19; i > 0; i--) ring.push([0, i]);
  for (const off of [0, ring.length / 2]) {
    const at = (Math.floor(off) + k * 19) % ring.length;
    for (let d = 0; d < 3; d++) {
      const [x, y] = ring[(at + d) % ring.length];
      p.set(x, y, shine);
    }
  }
  return p;
}

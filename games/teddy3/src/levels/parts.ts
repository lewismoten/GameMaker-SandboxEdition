// Building blocks the finale's levels share: multi-block art cut into named blocks, and the
// monster chains behind its gadgets. A button is a monster a high five beats: it lights up,
// then sends a spark down its wire to what it works and back (and is a button again, to
// push as often as you like). A door the spark reaches swings open, and a timed one shuts
// again after a while.
import type { Pixels } from '../../../kit/pixels';
import { canvas, cut } from '../blocks/tiles';
import type { Tiles } from './level';
import type { Bestiary } from '../characters/mons';
import { POWER } from '../ids';
import { button, zap } from '../sprites/gadgets';

/** Draws a w x h block picture over per-cell bases and adds its blocks as `name<x><y>`. */
export function art(
  t: Tiles,
  name: string,
  w: number,
  h: number,
  base: (bx: number, by: number) => Pixels,
  draw: (p: Pixels) => void,
  kind: (bx: number, by: number) => 'air' | 'wall' | 'ledge' = () => 'air',
): void {
  const p = canvas(w, h, base);
  draw(p);
  const cells = cut(p);
  for (let by = 0; by < h; by++) for (let bx = 0; bx < w; bx++) t[kind(bx, by)](`${name}${bx}${by}`, cells[by][bx]);
}

/** The spark's power: it beats a shut door (one less) and leaves an open one (the same) alone. */
export const SPARK = POWER.door;

/** Adds the button and spark pictures once. */
function buttonPics(b: Bestiary): void {
  if (b.mb.has('button')) return;
  b.pic('button', button(false)).pic('buttonLit', button(true)).pic('zap1', zap(0)).pic('zap2', zap(1));
}

/**
 * A button named `name` whose spark runs `wire` (block offsets from the button, the far end
 * last) to what it works and back. The spark passes through walls. `again`: false leaves the
 * button lit for good (a one-time switch).
 */
export function wiredButton(b: Bestiary, name: string, wire: [number, number][], again = true): void {
  buttonPics(b);
  b.add(name, { pics: [['button', 50]], power: POWER.paw - 1, becomes: `${name}Lit`, upscore: 25 });
  b.add(`${name}Lit`, { pics: [['buttonLit', 50]], power: SPARK, end: 6, becomes: `${name}Zap` });
  const out = wire.map(([x, y]) => [x, y, 5] as [number, number, number]);
  const back = again ? [...wire.slice(0, -1)].reverse().map(([x, y]) => [x, y, 5] as [number, number, number]) : [];
  b.add(`${name}Zap`, {
    pics: [
      ['zap1', 1],
      ['zap2', 1],
    ],
    power: SPARK,
    path: [...out, ...back, ...(again ? [[0, 0, 5] as [number, number, number]] : [])],
    end: -1,
    thru: false,
    becomes: again ? name : `${name}Done`,
  });
  if (!again) b.add(`${name}Done`, { pics: [['buttonLit', 50]], power: SPARK, end: 0 });
}

/**
 * A door the spark opens: `shut` (solid, in the way) and `open` pictures. `holdOpen` ticks
 * later a timed door swings shut again (through `closing`, when given).
 */
export function wiredDoor(b: Bestiary, name: string, shut: string, open: string, o: { holdOpen?: number; closing?: string } = {}): void {
  b.add(name, { pics: [[shut, 50]], power: SPARK - 1, becomes: `${name}Open` });
  if (!o.holdOpen) {
    b.add(`${name}Open`, { pics: [[open, 50]], power: SPARK, end: 0 });
    return;
  }
  b.add(`${name}Open`, { pics: [[open, 50]], power: SPARK, end: o.holdOpen, becomes: o.closing ? `${name}Closing` : name });
  if (o.closing) b.add(`${name}Closing`, { pics: [[o.closing, 3]], power: SPARK, end: 8, becomes: name });
}

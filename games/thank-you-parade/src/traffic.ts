// Crosswalk Corner's traffic gates: a two-block gate across the street with a traffic light on top. The light goes green (the
// gate is open, 90 ticks), yellow (still open, 30 ticks) and red (the gate is shut, 90 ticks), over and over, each gate on its own
// offset so no two agree. A gate's start blocks (`lite<i>`, `barr<i>`) say where in the 210-tick cycle it begins.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { PULL, SOLID } from '../../kit/starter/book';
import type { PBook } from './base';
import { onPaper } from './blocks';
import { inkLine, stripes, type Pal } from './print';

const T = 255;
export const GO = 90;
export const WARN = 30;
export const STOP = 90;
export const CYCLE = GO + WARN + STOP;
type Phase = 'Go' | 'Warn' | 'Stop';

/** The phase a gate with offset `o` is in at tick `t`, and the ticks left in it. */
export function phaseAt(o: number, t: number): { phase: Phase; left: number } {
  const p = (((t + o) % CYCLE) + CYCLE) % CYCLE;
  if (p < GO) return { phase: 'Go', left: GO - p };
  if (p < GO + WARN) return { phase: 'Warn', left: GO + WARN - p };
  return { phase: 'Stop', left: CYCLE - p };
}

/** True when a gate with offset `o` lets the hero through at tick `t`. */
export const gateOpen = (o: number, t: number): boolean => phaseAt(o, t).phase !== 'Stop';

const NEXT: Record<Phase, [Phase, number]> = { Go: ['Warn', WARN], Warn: ['Stop', STOP], Stop: ['Go', GO] };

/** The traffic light block: a navy box on a post with three lamps, the one for `phase` lit. */
function light(pal: Pal, phase: Phase): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, T);
  p.rect(3, 0, 14, 20, c('blue', 1));
  const lamps: [Phase, number, number][] = [
    ['Stop', 1, c('red', 2)],
    ['Warn', 7, c('gold', 4)],
    ['Go', 13, c('green', 3)],
  ];
  for (const [name, y, color] of lamps) {
    p.rect(6, y, 8, 6, name === phase ? color : c('stone', 2));
    if (name === phase) p.rect(7, y + 1, 3, 2, c('white', 3));
  }
  return onPaper(pal, inkLine(p, c('ink', 0)));
}

/** The gate block under the light: a post with its arm raised (open), or the arm across the street (shut: red and white). */
function barrier(pal: Pal, shut: boolean): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, T);
  p.rect(7, 0, 6, 20, c('blue', 1));
  if (shut) {
    p.rect(0, 0, 20, 20, c('white', 3));
    stripes(p, 0, 0, 20, 20, c('red', 2), 10, 5);
    p.rect(0, 0, 20, 2, c('blue', 1)).rect(0, 18, 20, 2, c('blue', 1));
  } else {
    p.rect(13, 2, 6, 2, c('white', 3)).rect(15, 0, 2, 2, c('red', 2));
  }
  return onPaper(pal, inkLine(p, c('ink', 0)));
}

/** Blocks for each gate (its offset in `offsets`): `lite<i>`/`barr<i>` at the start, then `liteGo`, `liteWarn`, `liteStop`, `barrGo`... */
export function addGates(book: PBook, pal: Pal, offsets: number[]): void {
  const phases: Phase[] = ['Go', 'Warn', 'Stop'];
  const open = { grav: PULL.down };
  const shut = { solid: SOLID, grav: PULL.down };
  for (const ph of phases) {
    book.add(`lite${ph}`, light(pal, ph), ph === 'Stop' ? shut : open);
    book.add(`barr${ph}`, barrier(pal, ph === 'Stop'), ph === 'Stop' ? shut : open);
    const [next, ticks] = NEXT[ph];
    book.time(`lite${ph}`, `lite${next}`, ticks).time(`barr${ph}`, `barr${next}`, ticks);
  }
  offsets.forEach((o, i) => {
    const { phase, left } = phaseAt(o, 0);
    const [next] = NEXT[phase];
    book.add(`lite${i}`, light(pal, phase), phase === 'Stop' ? shut : open);
    book.add(`barr${i}`, barrier(pal, phase === 'Stop'), phase === 'Stop' ? shut : open);
    book.time(`lite${i}`, `lite${next}`, left).time(`barr${i}`, `barr${next}`, left);
  });
}

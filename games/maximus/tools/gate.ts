// The bot's way through Maxima Station's clearance gate (wheel/wheel.ts): up the ledge to the
// clerk's window and, when asked, a look at the form; then to the hatch that wears the code the
// form works out to, and through it to the airlock. The bot "has the wheel": it knows the answer,
// as a player who turned the box's wheel does. Works on a Sim (the demo) or the Live engine.
import { GATE } from '../src/levels/home';
import { HATCH_OPEN } from '../src/wheel/wheel';
import { SCAN } from '../src/ids';
import { seek } from './drive';
import type { Driver } from './live';

const inRows = (rows: number[], y: number) => y === rows[0] || y === rows[0] + 1;

/** Holds right across the training deck, hopping when stuck, until Max is up in the pod bay. */
export async function crossDeck(d: Driver, maxTicks = 1500): Promise<boolean> {
  d.press(SCAN.right);
  let last = d.pos.x;
  let stuck = 0;
  for (let t = 0; t < maxTicks && d.link < 0 && !d.dead && !(d.pos.bx >= 74 && d.pos.by < 48); t++) {
    await d.tick();
    stuck = d.pos.x === last ? stuck + 1 : 0;
    last = d.pos.x;
    if (stuck > 2) {
      d.press(SCAN.up);
      await d.tick();
      d.release(SCAN.up);
      stuck = 0;
    }
  }
  d.release(SCAN.right);
  return d.link < 0 && !d.dead && d.pos.bx >= 74;
}

/** Cells whose touch is a link to a page: the wrong hatches, and the clerk's window unless wanted. */
const avoidLinks = (desk: boolean) => (x: number, y: number) =>
  (x === GATE.wall && (inRows([GATE.hatchRows[0]], y) || inRows([GATE.hatchRows[2]], y))) || (!desk && x === GATE.desk.x && inRows(GATE.desk.rows, y));

/** Up on the lower ledge, then left into the clerk's window until its link fires. */
export async function visitDesk(d: Driver): Promise<boolean> {
  const ledge = { x: GATE.desk.x + 2, y: GATE.desk.rows[1] };
  await seek(d, ledge, { mode: 'walk', tall: 2, avoid: avoidLinks(false), maxTicks: 900 });
  d.press(SCAN.left);
  for (let t = 0; t < 90 && d.link < 0 && !d.dead; t++) await d.tick();
  d.release(SCAN.left);
  return d.link >= 0;
}

/** Up the ledge to the middle hatch and into it, with hops where the way is stuck, until the airlock's link fires. */
export async function throughGate(d: Driver): Promise<void> {
  const row = GATE.hatchRows[HATCH_OPEN] + 1; // standing on the lower ledge, the row of the hatch's lower half
  await seek(d, { x: GATE.wall - 1, y: row }, { mode: 'walk', tall: 2, avoid: avoidLinks(false), maxTicks: 900 });
  d.press(SCAN.right);
  let last = d.pos.x;
  let stuck = 0;
  for (let t = 0; t < 600 && d.link < 0 && !d.dead; t++) {
    await d.tick();
    stuck = d.pos.x === last ? stuck + 1 : 0;
    last = d.pos.x;
    // the hatch opens at the touch; if the way is still shut a few ticks on, lean on it a little longer
    if (stuck > 40) {
      d.release(SCAN.right);
      await d.tick();
      d.press(SCAN.right);
      stuck = 0;
    }
  }
  d.release(SCAN.right);
}

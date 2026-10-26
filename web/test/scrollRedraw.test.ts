// Tests: DrawScroll redraws a character that moved against the scroll, as PLAYGAME.C does.
//
// What PLAYGAME.C does (and the port copies):
// - ShiftEverything (PLAYGAME.C 4172) moves ci.scry with the map only when the character is
//   still (nexty == oldy) or moving the same way as the shift; otherwise it returns MoveChar.
// - DrawScroll (PLAYGAME.C 4098) then calls drawchars, which sets oldx/oldy to scrx/scry. So on
//   the next 1/145.6 s step the character's own move counts as used up, and from then on scry
//   rides along with the map again: by the end of the tick it is where the character is shown.
// - Before the port did the redraw's bookkeeping, scry stayed put for a whole scroll. ChkMonChr
//   reads scry, so a see-saw end that the view brought onto the screen above a swimming hero took
//   him for being above it and lifted him onto it, into row my, where nexty is 2000+
//   (charScreenColumn.test.ts) and the view ran off round the map after him.
import { describe, expect, it } from 'vitest';
import { newMap } from '../src/formats/map';
import { createWorld } from '../src/engine/world';
import { drawScroll } from '../src/engine/scroll';

function world() {
  const w = createWorld(newMap(), { play: () => false }, () => 0.5);
  w.mx = 10;
  w.my = 20;
  // the view scrolls up (the map moves down) 4 pixels each step
  w.scroll.bx = { dscroll: 0, ctr: 0, iters: 8 };
  w.scroll.by = { dscroll: -32, ctr: 0, iters: 8 };
  Object.assign(w.ci, { scrx: 100, oldx: 100, nextx: 100, scry: 100, oldy: 100 });
  return w;
}

describe('drawScroll (DrawScroll, PLAYGAME.C 3972)', () => {
  it('a character still on screen rides along with the map', () => {
    const w = world();
    w.ci.nexty = 100;
    for (let i = 0; i < 8; i++) drawScroll(w);
    expect([w.ci.scry, w.ci.nexty, w.ci.oldy]).toEqual([132, 132, 132]);
  });
  it('a character moving against the scroll is drawn where it is by the end of the tick', () => {
    const w = world();
    // it rose 8 pixels this tick while the view scrolls up
    w.ci.nexty = 92;
    drawScroll(w);
    // the first step leaves scry for the character's own move, and the redraw sets oldy to it
    expect([w.ci.scry, w.ci.nexty, w.ci.oldy]).toEqual([100, 96, 100]);
    for (let i = 1; i < 8; i++) drawScroll(w);
    expect([w.ci.scry, w.ci.nexty, w.ci.oldy]).toEqual([124, 124, 124]);
    expect([w.my, w.scroll.ny]).toEqual([18, 8]);
  });
});

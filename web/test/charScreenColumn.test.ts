// Tests: where the character lands on screen when it is in the map column (or row) at the
// screen's upper left (mx/my), including across the 100x100 map wrap.
//
// What PLAYGAME.C does (and the port copies):
// - movechars ends with (PLAYGAME.C 2593-2601)
//     if (mx<chr.x[0]) tx=(chr.x[0]-mx)*BLEN; else tx=(MLEN+(chr.x[0]-mx))*BLEN;
//   The test is a strict <, so a character IN column mx is counted as MLEN (100) columns to the
//   right: nextx = 2000 + x[1] - scroll.nx, far off the right of the 320 pixel screen. The same goes
//   for row my (MWID). Column mx is the left column drawmap draws (PLAYGAME.C 4340), so it is a
//   real, partly visible column; the C just never puts the character there on purpose.
// - chkscrnbounds (PLAYGAME.C 3395) is what keeps it out: once the character is in column mx+1
//   (tmx<2) a step left is cut to x[1] so it stops at the column's left edge, and in column mx
//   (tmx<1) it cannot move left at all.
// - A solid monster has no such guard: movechars (PLAYGAME.C 2508-2512) sets
//   chr.x[0]=mi[MMsolid].curx[0]-1 for a monster pushing from the right, so a monster in column
//   mx+1 shoves the character into column mx, and the formula above puts it at nextx >= 2000.
//   ChangeScroll (PLAYGAME.C 3916) then sees the character far right of center and scrolls.
// - Across the wrap the same holds: mx=99 with the character at x 0 is one column in (20 pixels),
//   and a push from a monster at x 0 gives x[0]=-1, which chkmapbounds wraps to 99 = mx.
import { describe, expect, it } from 'vitest';
import { newMap } from '../src/formats/map';
import { newCharacter } from '../src/formats/character';
import { createWorld } from '../src/engine/world';
import { moveChars, updateCharScreenPos } from '../src/engine/character';
import { changeScroll } from '../src/engine/scroll';
import { SOLRIG, SOLBOT } from '../src/formats/blocks';

function world(mx: number, my: number, cx: number, cy: number, step = 0) {
  const w = createWorld(newMap(), { play: () => false }, () => 0.5);
  const chr = newCharacter();
  // Every sequence is one frame stepping `step` pixels, so whichever sequence the key stack falls
  // back to keeps walking.
  for (const seq of chr.sequences) seq.frames[0] = { ...chr.sequences[0].frames[0], x: step, pause: 0 };
  chr.x = [cx, 0];
  chr.y = [cy, 0];
  w.chr = chr;
  w.noMons = false;
  w.mx = mx;
  w.my = my;
  w.ci.nextAni = 0;
  return w;
}

describe('updateCharScreenPos (movechars tail, PLAYGAME.C 2593)', () => {
  it('counts column mx and row my as 100 blocks away, like the C strict <', () => {
    const w = world(10, 20, 10, 20);
    w.chr.x[1] = 3;
    w.chr.y[1] = 4;
    updateCharScreenPos(w);
    expect(w.ci.nextx).toBe(100 * 20 + 3);
    expect(w.ci.nexty).toBe(100 * 20 + 4);
    w.chr.x[0] = 11;
    w.chr.y[0] = 21;
    updateCharScreenPos(w);
    expect(w.ci.nextx).toBe(20 + 3);
    expect(w.ci.nexty).toBe(20 + 4);
  });
  it('wraps at the map edge', () => {
    const w = world(99, 99, 0, 0);
    updateCharScreenPos(w);
    expect([w.ci.nextx, w.ci.nexty]).toEqual([20, 20]);
    w.chr.x[0] = 99;
    w.chr.y[0] = 99;
    updateCharScreenPos(w);
    expect([w.ci.nextx, w.ci.nexty]).toEqual([2000, 2000]);
    w.mx = 0;
    w.chr.x[0] = 99;
    updateCharScreenPos(w);
    expect(w.ci.nextx).toBe(99 * 20);
  });
});

describe('moveChars near column mx', () => {
  for (const [mx, cx] of [
    [10, 11],
    [99, 0],
  ]) {
    it(`walking left stops at the left edge of column mx+1 (mx ${mx})`, async () => {
      const w = world(mx, 40, cx, 45, -5);
      w.chr.x[1] = 8;
      for (let i = 0; i < 10; i++) {
        await moveChars(w, async () => 0);
        w.clock++;
      }
      expect(w.chr.x).toEqual([cx, 0]);
      expect(w.ci.nextx).toBe(20);
    });

    it(`a solid monster pushing from the right puts the character in column mx, off screen (mx ${mx})`, async () => {
      const w = world(mx, 40, cx, 45);
      w.mi[0].curx = [cx, 6];
      w.mi[0].cury = [45, 0];
      w.monsolid = SOLRIG;
      w.mmSolid = 0;
      await moveChars(w, async () => 0);
      expect(w.chr.x).toEqual([mx, 6]);
      expect(w.ci.nextx).toBe(2000 + 6);
      // ChangeScroll sees it far right of center and starts scrolling the map left (mx++).
      w.scroll.left = 0xff;
      changeScroll(w);
      expect(w.scroll.totalx).toBe(28);
    });
  }

  it('a solid monster pushing from below puts the character in row my across the wrap', async () => {
    const w = world(30, 99, 35, 0);
    w.mi[0].curx = [35, 0];
    w.mi[0].cury = [0, 0];
    w.monsolid = SOLBOT;
    w.mmSolid = 0;
    await moveChars(w, async () => 0);
    expect(w.chr.y[0]).toBe(99);
    expect(w.ci.nexty).toBe(2000);
  });
});

// DEX.CHR (Dex on Earth, and indoors at the Moon School) and MOON.CHR (Dex in his moon
// suit, bounding along in one-sixth gravity: a big push off, then he floats in to land,
// a whole block per bound).
import { CHARBL, MONBL } from '../../../../web/src/formats/blocks';
import { INF_REPEAT, emptyFrame, newCharacter, type Character, type Frame, type Sequence } from '../../../../web/src/formats/character';
import type { BlockSet } from '../blocks/book';
import { CTR, MON, SEQ, SND } from '../ids';

export const KEY = { right: 0x4d00, left: 0x4b00, up: 0x4800, down: 0x5000, space: 0x3920, g: 0x2267 };
/**
 * Alternate keys (scan code << 8 | ASCII). Game-Maker can't read two arrows at once, so the
 * diagonals get keys of their own: Q/E and the number pad's 7/9/1/3. W/A/S/D copy the arrows.
 */
export const ALT = {
  w: 0x1177,
  a: 0x1e61,
  s: 0x1f73,
  d: 0x2064,
  q: 0x1071,
  e: 0x1265,
  pad7: 0x4700,
  pad9: 0x4900,
  pad1: 0x4f00,
  pad3: 0x5100,
};
/** Joystick directions, clockwise from up. */
const JOY = { up: 1, upRight: 2, right: 3, downRight: 4, down: 5, downLeft: 6, left: 7, upLeft: 8 };
/** Sequences 10-19: the alternate keys (none of those slots is a counter). */
const EXTRA = 10;

function set(s: Sequence, frames: Frame[], o: Partial<Omit<Sequence, 'frames'>> = {}): void {
  frames.forEach((fr, i) => (s.frames[i] = fr));
  for (let i = frames.length; i < s.frames.length; i++) s.frames[i] = emptyFrame(true);
  Object.assign(s, o);
}

export function buildCharacter(cb: BlockSet, moon: boolean): Character {
  const pre = moon ? 'm_' : '';
  const f = (pic: string, pause: number, x = 0, y = 0, mirror = false): Frame => ({
    ...emptyFrame(),
    x,
    y,
    pic1: CHARBL,
    pic2: cb.id(pre + pic),
    pause,
    orient: mirror ? 0x40 : 0,
  });
  const birth = (mon: number): Frame => ({ ...emptyFrame(), x: 0, y: 20, pic1: mon, pic2: MONBL, pause: 1 });

  const ch = newCharacter();
  const S = ch.sequences;
  set(S[SEQ.idle], [f('down0', 40), f('blink', 3), f('down0', 30), f('blink', 3), f('down0', 12), f('blink', 2)]);
  set(S[SEQ.die], [f('hurt', 2), f('die0', 3), f('die1', 3), f('die2', 6), f('die3', 24)], { sound: SND.die });
  // One quick flash: a longer hurt would freeze Dex while a car (or a dinosaur) keeps hitting him.
  set(S[SEQ.hurt], [f('hurt', 1)], { sound: SND.hurt });
  // G picks up what Dex stands on. Almost nothing in the future needs picking up by hand.
  set(S[SEQ.pickup], [f('blink', 2), f('down0', 1)], { key: KEY.g, sound: SND.pickup, ground: 1, norepeat: 1 });
  set(S[SEQ.drop], [f('down0', 1)], { key: 0 });

  const side = ['side1', 'side0', 'side1', 'side0'];
  const walks: [number, number, number, number, string[], boolean, number][] = [
    [SEQ.right, KEY.right, 1, 0, side, false, JOY.right],
    [SEQ.left, KEY.left, -1, 0, side, true, JOY.left],
    [SEQ.up, KEY.up, 0, -1, ['up1', 'up0', 'up2', 'up0'], false, JOY.up],
    [SEQ.down, KEY.down, 0, 1, ['down1', 'down0', 'down2', 'down0'], false, JOY.down],
    // W/A/S/D: the same four walks (no joystick; the arrows' copies already answer it).
    [EXTRA + 0, ALT.d, 1, 0, side, false, 0],
    [EXTRA + 1, ALT.a, -1, 0, side, true, 0],
    [EXTRA + 2, ALT.w, 0, -1, ['up1', 'up0', 'up2', 'up0'], false, 0],
    [EXTRA + 3, ALT.s, 0, 1, ['down1', 'down0', 'down2', 'down0'], false, 0],
    // Diagonals: Q and E (up-left, up-right), then the number pad's 7, 9, 1 and 3.
    [EXTRA + 4, ALT.q, -1, -1, side, true, JOY.upLeft],
    [EXTRA + 5, ALT.e, 1, -1, side, false, JOY.upRight],
    [EXTRA + 6, ALT.pad7, -1, -1, side, true, 0],
    [EXTRA + 7, ALT.pad9, 1, -1, side, false, 0],
    [EXTRA + 8, ALT.pad1, -1, 1, side, true, JOY.downLeft],
    [EXTRA + 9, ALT.pad3, 1, 1, side, false, JOY.downRight],
  ];
  for (const [n, key, dx, dy, pics, mirror, joy] of walks) {
    // On Earth: 5 pixels a step. On the Moon: a big bound that slows as he floats down.
    // Diagonals move a full step on both axes, so Dex stays lined up with the 20-pixel grid.
    const steps = moon ? [8, 6, 4, 2] : [5, 5, 5, 5];
    set(
      S[n],
      pics.map((p, i) => f(p, 1, dx * steps[i], dy * steps[i], mirror)),
      { key, jstkMov: joy, jstkBut: 4, sound: SND.none },
    );
  }
  set(S[SEQ.zap], [f('zap', 2), birth(MON.zap), f('zap2', 2), f('down0', 1)], {
    key: KEY.space,
    sound: SND.zap,
    ground: 1,
    norepeat: 1,
    jstkMov: 9,
    jstkBut: 1,
  });

  ch.meter.fill(INF_REPEAT);
  ch.meter[0] = 100;
  ch.meter[CTR.lives] = 3;
  // Counters that a block can refuse read one more than they hold.
  ch.meter[CTR.quarters] = 1;
  for (let i = 20; i < 30; i++) ch.meter[i] = 1;
  // No Zapper yet: you find it in the backyard.
  ch.meter[SEQ.zap] = 0;
  ch.cseq = 0;
  ch.cframe = 0;
  return ch;
}

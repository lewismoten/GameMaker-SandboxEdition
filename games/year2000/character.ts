// DEX.CHR (Dex on Earth, and indoors at the Moon School) and MOON.CHR (Dex in his moon
// suit, bounding along in one-sixth gravity: a big push off, then he floats in to land,
// a whole block per bound).
import { CHARBL, MONBL } from '../../web/src/formats/blocks';
import { INF_REPEAT, emptyFrame, newCharacter, type Character, type Frame, type Sequence } from '../../web/src/formats/character';
import type { BlockSet } from './book';
import { CTR, MON, SEQ, SND } from './ids';

export const KEY = { right: 0x4d00, left: 0x4b00, up: 0x4800, down: 0x5000, space: 0x3920 };
/** Joystick directions, clockwise from up. */
const JOY = { up: 1, right: 3, down: 5, left: 7 };

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
  set(S[SEQ.pickup], [f('down0', 1)], { key: 0 });
  set(S[SEQ.drop], [f('down0', 1)], { key: 0 });

  const walks: [number, number, number, number, string[], boolean, number][] = [
    [SEQ.right, KEY.right, 1, 0, ['side1', 'side0', 'side1', 'side0'], false, JOY.right],
    [SEQ.left, KEY.left, -1, 0, ['side1', 'side0', 'side1', 'side0'], true, JOY.left],
    [SEQ.up, KEY.up, 0, -1, ['up1', 'up0', 'up2', 'up0'], false, JOY.up],
    [SEQ.down, KEY.down, 0, 1, ['down1', 'down0', 'down2', 'down0'], false, JOY.down],
  ];
  for (const [n, key, dx, dy, pics, mirror, joy] of walks) {
    // On Earth: 5 pixels a step. On the Moon: a big bound that slows as he floats down.
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

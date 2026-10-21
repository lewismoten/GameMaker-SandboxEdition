// ADA.CHR and ADA.CBL: Inspector Penn walks in eight directions on the arrows, on WASD,
// on Q/E (up and to the side) and on the number pad's corners; Space picks things up;
// L raises the prop magnifying glass, but only while she carries it.
import { CHARBL } from '../../../../web/src/formats/blocks';
import { INF_REPEAT, emptyFrame, newCharacter, type Character, type Frame, type Sequence } from '../../../../web/src/formats/character';
import { BlockSet } from '../blocks/blockset';
import { ADA, strikeFrames } from '../sprites/ada';
import { CTR, KEY, SEQ, SND } from '../ids';
import { ITEMS } from '../blocks/tiles';

export function buildAdaBlocks(): BlockSet {
  const cb = new BlockSet(50, true);
  for (const [name, p] of Object.entries(ADA)) cb.add(name, p);
  strikeFrames().forEach((p, i) => cb.add(`strike${i}`, p));
  return cb;
}

const JOY = { up: 1, upRight: 2, right: 3, downRight: 4, down: 5, downLeft: 6, left: 7, upLeft: 8 };

function set(s: Sequence, frames: Frame[], o: Partial<Omit<Sequence, 'frames'>> = {}): void {
  frames.forEach((fr, i) => (s.frames[i] = fr));
  for (let i = frames.length; i < s.frames.length; i++) s.frames[i] = emptyFrame(true);
  Object.assign(s, o);
}

export function buildCharacter(): Character {
  const cb = buildAdaBlocks();
  const f = (pic: string, pause: number, x = 0, y = 0, mirror = false): Frame => ({
    ...emptyFrame(),
    x,
    y,
    pic1: CHARBL,
    pic2: cb.id(pic),
    pause,
    orient: mirror ? 0x40 : 0,
  });
  const ch = newCharacter();
  const S = ch.sequences;
  set(S[SEQ.idle], [f('down0', 50), f('blink', 3), f('down0', 36), f('blink', 2), f('down0', 8), f('blink', 2)]);
  set(S[SEQ.die], [f('strike0', 5), f('strike1', 8), f('strike2', 30)], { sound: SND.strike });
  set(S[SEQ.hurt], [f('blink', 1)], { sound: SND.none });
  set(S[SEQ.pickup], [f('pickup', 3), f('down0', 1)], { key: KEY.space, sound: SND.pickup, jstkBut: 1, jstkMov: 9, norepeat: 1 });
  set(S[SEQ.drop], [f('down0', 1)], { key: 0 });

  const walk = (dx: number, dy: number): Frame[] => {
    if (dx === 0) {
      const pics = dy < 0 ? ['up1', 'up0', 'up2', 'up0'] : ['down1', 'down0', 'down2', 'down0'];
      return pics.map((p) => f(p, 1, 0, dy * 5));
    }
    const step = dy === 0 ? 5 : 4;
    return ['side1', 'side0', 'side2', 'side0'].map((p) => f(p, 1, dx * step, dy * step, dx < 0));
  };
  const moves: [number, number, number, number, number][] = [
    [SEQ.right, KEY.right, 1, 0, JOY.right],
    [SEQ.left, KEY.left, -1, 0, JOY.left],
    [SEQ.up, KEY.up, 0, -1, JOY.up],
    [SEQ.down, KEY.down, 0, 1, JOY.down],
    [SEQ.d, KEY.d, 1, 0, 0],
    [SEQ.a, KEY.a, -1, 0, 0],
    [SEQ.w, KEY.w, 0, -1, 0],
    [SEQ.s, KEY.s, 0, 1, 0],
    [SEQ.q, KEY.q, -1, -1, 0],
    [SEQ.e, KEY.e, 1, -1, 0],
    [SEQ.num7, KEY.num7, -1, -1, JOY.upLeft],
    [SEQ.num9, KEY.num9, 1, -1, JOY.upRight],
    [SEQ.num1, KEY.num1, -1, 1, JOY.downLeft],
    [SEQ.num3, KEY.num3, 1, 1, JOY.downRight],
  ];
  for (const [n, key, dx, dy, joy] of moves) set(S[n], walk(dx, dy), { key, jstkMov: joy, jstkBut: joy ? 4 : 0, sound: SND.none });
  // The lens: a sequence tied to the magnifying glass block, so it only works while she has it.
  set(S[SEQ.lens], [f('lens', 12), f('lens', 6)], { key: KEY.l, sound: SND.lens, bloc: ITEMS.indexOf('lens'), norepeat: 1 });

  ch.meter.fill(INF_REPEAT);
  ch.meter[0] = 100; // hit points: only a wrong accusation takes them
  ch.meter[1] = 2; // lives: three chances to name the killer
  ch.meter[CTR.evidence] = 1;
  for (let i = 20; i < 30; i++) ch.meter[i] = 1;
  ch.cseq = 0;
  ch.cframe = 0;
  return ch;
}

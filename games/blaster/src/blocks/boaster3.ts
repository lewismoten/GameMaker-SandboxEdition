// Stage 3-C: THE BIG NAME, flown over the face of the family 486's sound card, the Sound
// Boaster (Overcreative Labs, a made-up brand, as in TURBO BUTTON's ad for it). The red board
// of the rest of Stage 3, gold edge fingers at the slot, a steel bracket down the left with
// its jacks, volume wheel and joystick port, black chips that carry their makers' (parody)
// names, and SOUND BOASTER silkscreened in white across the middle (boasterName.ts). Its
// virus is at the bottom.
import { Pixels, rng } from '../../../kit/pixels';
import { BlockSet, CLEAR, bevel, blob, micro, outline, shadeAt, text } from '../art/draw';
import { pics } from '../characters/enemies';
import type { Bestiary } from '../characters/mons';
import type { Pal } from '../art/pal';
import { bomb, disc, keyOf, mite, note } from '../sprites/sprites';
import { HURT } from '../characters/sharedMonsters';
import { onFloor, slices, type StageArt } from './tiles';

export function boasterArt(p: Pal): StageArt {
  const weave = (seed: number) => {
    const t = new Pixels(20, 20);
    const r = rng(seed);
    t.map((x, y) => {
      const w = ((x + y) % 4 === 0 ? 0.12 : 0) + ((x - y + 40) % 4 === 0 ? 0.08 : 0);
      return shadeAt(p.r('base'), 1, 3, 0.3 + w + r() * 0.15, x, y);
    });
    return t;
  };
  const trace = p.c('base', 5);
  const floor = (v: number): Pixels => {
    const t = weave(v + 3);
    if (v === 1) {
      // a trace across, with a via
      t.rect(0, 9, 20, 2, trace);
      blob(t, 14.5, 9.5, 2.5, 2.5, p.r('gold'), 1, 4);
      t.set(14, 9, p.c('ink', 0));
    } else if (v === 2) {
      // a trace up the board
      t.rect(9, 0, 2, 20, trace);
    } else if (v === 3) {
      // two vias
      for (const [x, y] of [
        [5, 5],
        [14, 14],
      ]) {
        t.rect(x - 1, y - 1, 3, 3, p.c('gold', 3));
        t.set(x, y, p.c('ink', 0));
      }
    }
    return t;
  };
  const edge = (side: 'L' | 'R', v: number): Pixels => {
    if (side === 'L') {
      // the steel bracket, its fold catching the light on the board side
      const t = new Pixels(20, 20);
      t.map((x, y) => shadeAt(p.r('steel'), 2, 4, 0.3 + x / 30, x, y));
      t.rect(17, 0, 2, 20, p.c('steel', 5)).rect(19, 0, 1, 20, p.c('steel', 1));
      if (v === 1) t.rect(6, 3, 6, 14, p.c('steel', 1)).rect(7, 4, 4, 12, p.c('ink', 0));
      return t;
    }
    // the card's top edge: bare board, a ground trace, the routed edge
    const t = weave(40 + v);
    t.rect(4, 0, 2, 20, trace);
    t.rect(17, 0, 3, 20, p.c('base', 1)).rect(17, 0, 1, 20, p.c('base', 6));
    if (v === 1) t.rect(3, 8, 4, 4, p.c('gold', 3)).set(4, 9, p.c('ink', 0));
    return t;
  };
  return { pal: p, floor, edge, floors: 4, edges: 2 };
}

/**
 * Adds a picture's 20x20 cells, reusing a block wherever a cell is the same as one already in
 * the set (plain floor, or a cell of a letter used twice). Returns the block names by
 * [row][column], row 0 at the top.
 */
export function slicesShared(bs: BlockSet, prefix: string, big: Pixels, props: (r: number, c: number) => object = () => ({})): string[][] {
  const seen = new Map<string, string>();
  for (const n of bs.names) {
    if (n.startsWith('(empty')) continue;
    seen.set(bs.pic(n).px.join(), n);
  }
  const out: string[][] = [];
  let k = 0;
  for (let r = 0; r < big.h / 20; r++) {
    out.push([]);
    for (let c = 0; c < big.w / 20; c++) {
      const cell = big.crop(c * 20, r * 20, 20, 20);
      const pr = props(r, c);
      const key = cell.px.join();
      let name = Object.keys(pr).length ? undefined : seen.get(key);
      if (!name) {
        name = `${prefix}${k++}`;
        bs.add(name, cell, pr);
        if (!Object.keys(pr).length) seen.set(key, name);
      }
      out[r].push(name);
    }
  }
  return out;
}

/** A black chip w x h blocks with its maker's name in the PC's font (lines centered). */
function bigChip(a: StageArt, w: number, h: number, lines: string[], small?: string): Pixels {
  const p = a.pal;
  const big = onFloor(a, w, h);
  const W = w * 20;
  const H = h * 20;
  // the legs along the long sides
  for (let x = 6; x < W - 6; x += 6) big.rect(x, 1, 3, 4, p.c('steel', 5)).rect(x, H - 5, 3, 4, p.c('steel', 4));
  bevel(big, 2, 4, W - 4, H - 8, p.r('deep'), 1, 1);
  blob(big, 8, H / 2, 2.5, 2.5, p.r('deep'), 0, 0);
  const lh = 12;
  const y0 = Math.round(H / 2 - (lines.length * lh - 4) / 2) - (small ? 2 : 0);
  lines.forEach((s, i) => text(big, Math.round(W / 2 - s.length * 4), y0 + i * lh, s, p.c('gray', 7)));
  if (small) micro(big, Math.round(W / 2 - small.length * 2), H - 11, small, p.c('gray', 5));
  return big;
}

/** A small black chip with its maker's name in the tiny font. */
function smallChip(a: StageArt, w: number, lines: string[]): Pixels {
  const p = a.pal;
  const big = onFloor(a, w, 1);
  const W = w * 20;
  for (let x = 5; x < W - 4; x += 5) big.rect(x, 0, 2, 3, p.c('steel', 5)).rect(x, 17, 2, 3, p.c('steel', 4));
  bevel(big, 2, 3, W - 4, 14, p.r('deep'), 1, 1);
  lines.forEach((s, i) => micro(big, Math.round(W / 2 - s.length * 2), 4 + i * 6, s, p.c('gray', i ? 6 : 7)));
  return big;
}

/** The gold fingers of the edge connector: 'top' (traces run in), 'mid', 'end' (the board's edge). */
function fingers(a: StageArt, part: 'top' | 'mid' | 'end'): Pixels {
  const p = a.pal;
  const t = a.floor(0);
  for (let x = 1; x < 20; x += 5) {
    if (part === 'top') {
      t.rect(x + 1, 0, 1, 10, p.c('base', 5));
      t.rect(x, 10, 3, 10, p.c('gold', 3)).rect(x, 10, 1, 10, p.c('gold', 4));
      t.rect(x, 10, 3, 1, p.c('gold', 4));
    } else {
      t.rect(x, 0, 3, part === 'end' ? 16 : 20, p.c('gold', 3)).rect(x, 0, 1, part === 'end' ? 16 : 20, p.c('gold', 4));
    }
  }
  if (part === 'end') t.rect(0, 16, 20, 4, p.c('base', 0)).rect(0, 16, 20, 1, p.c('base', 6));
  return t;
}

/** A jack on the bracket, seen end on. */
function jack(a: StageArt, ring: string): Pixels {
  const p = a.pal;
  const t = a.edge('L', 0);
  blob(t, 9.5, 9.5, 7.5, 7.5, p.r('deep'), 0, 2);
  t.ring(9.5, 9.5, 5.5, p.c(ring, 3));
  blob(t, 9.5, 9.5, 2.5, 2.5, p.r('steel'), 3, 6);
  return t;
}

/** The volume wheel (2 rows), its knurled edge sticking out of the bracket onto the board. */
function wheel(a: StageArt): Pixels {
  const p = a.pal;
  const big = new Pixels(40, 40);
  big.blit(a.edge('L', 0), 0, 0).blit(a.edge('L', 0), 0, 20);
  big.blit(a.floor(0), 20, 0).blit(a.floor(0), 20, 20);
  blob(big, 14, 20, 17, 17, p.r('deep'), 1, 3);
  for (let k = 0; k < 24; k++) {
    const an = (k / 24) * Math.PI * 2;
    big.rect(14 + Math.cos(an) * 16 - 1, 20 + Math.sin(an) * 16 - 1, 2, 2, p.c('steel', 4));
  }
  blob(big, 14, 20, 6, 6, p.r('steel'), 2, 5);
  micro(big, 22, 2, 'VOL', p.c('gray', 7));
  micro(big, 31, 9, '+', p.c('gray', 7));
  micro(big, 31, 29, '-', p.c('gray', 7));
  return big;
}

/** The joystick/MIDI port (3 rows): a 15-pin socket in the bracket. */
function port(a: StageArt): Pixels {
  const p = a.pal;
  const big = new Pixels(20, 60);
  for (let r = 0; r < 3; r++) big.blit(a.edge('L', 0), 0, r * 20);
  big.rect(3, 4, 13, 52, p.c('steel', 1));
  for (let y = 6; y < 54; y++) {
    const inset = Math.round(((y - 6) / 48) * 2);
    big.rect(5 + inset, y, 9 - inset, 1, p.c('deep', 1));
  }
  for (let k = 0; k < 8; k++) big.rect(7, 9 + k * 6, 2, 2, p.c('gold', 3));
  for (let k = 0; k < 7; k++) big.rect(11, 12 + k * 6, 2, 2, p.c('gold', 3));
  return big;
}

/** The QC sticker from the ad, and it knows it. */
function sticker(a: StageArt): Pixels {
  const p = a.pal;
  const big = onFloor(a, 3, 1);
  big.rect(1, 3, 58, 15, p.c('ink', 0));
  big.rect(0, 2, 58, 15, p.c('gold', 4));
  micro(big, 7, 4, 'Q.C. PASSED', p.c('ink', 0));
  micro(big, 0, 11, 'AND IT KNOWS IT', p.c('red', 1));
  return big;
}

function crystal(a: StageArt): Pixels {
  const p = a.pal;
  const t = a.floor(0);
  bevel(t, 2, 5, 16, 10, p.r('steel'), 4, 1);
  micro(t, 3, 7, '14.3', p.c('ink', 0));
  return t;
}

function capacitor(a: StageArt, ramp: string): Pixels {
  const p = a.pal;
  const t = a.floor(0);
  blob(t, 10, 10, 8, 8, p.r(ramp), 0, 3);
  t.ring(10, 10, 4, p.c('steel', 5));
  t.rect(3, 6, 2, 8, p.c('gray', 6));
  return t;
}

/** The faint trace a jack's sound waves run along, so the lane shows before the wave does. */
function waveTrace(a: StageArt): Pixels {
  const p = a.pal;
  const t = a.floor(0);
  t.rect(0, 6, 20, 1, p.c('base', 5)).rect(0, 13, 20, 1, p.c('base', 5));
  for (const x of [3, 13]) t.line(x, 8, x + 3, 10, p.c('gray', 5)).line(x + 3, 10, x, 12, p.c('gray', 5));
  return t;
}

export function boasterTiles(bs: BlockSet, a: StageArt): void {
  bs.add('fingTop', fingers(a, 'top'));
  bs.add('fing', fingers(a, 'mid'));
  bs.add('fingEnd', fingers(a, 'end'));
  bs.add('jackG', jack(a, 'slime'));
  bs.add('jackP', jack(a, 'pink'));
  // the line-out jack: a sound wave rolls out of it across the board, along its trace
  bs.add('jackW', jack(a, 'cyan'), { birth: 'wave', birthTime: 36 });
  bs.add('wTrace', waveTrace(a));
  slices(bs, 'wheel', wheel(a));
  slices(bs, 'port', port(a));
  // the FM music chip: the two cells at its bottom corners laugh out loud
  const fm = bigChip(a, 5, 2, ['YO MAMA!', 'HA HA HA'], 'FM MUSIC 9 VOICES');
  for (let r = 0; r < 2; r++)
    for (let c = 0; c < 5; c++) {
      const laugh = r === 1 && (c === 0 || c === 4) ? { birth: c ? 'haR' : 'haL', birthTime: 40 } : {};
      bs.add(`ym${r}${c}`, fm.crop(c * 20, r * 20, 20, 20), laugh);
    }
  slices(bs, 'dsp', bigChip(a, 3, 2, ['ANALOG', 'DEVIOUS']));
  slices(bs, 'amp', smallChip(a, 3, ['TEXAS', 'INSTRUMENTALS']));
  slices(bs, 'qc', sticker(a));
  bs.add('xtal', crystal(a));
  bs.add('capB', capacitor(a, 'blue'));
  bs.add('capK', capacitor(a, 'deep'));
}

// ------------------------------------------------------------------ the virus

/** The Beeper: a PC-speaker gremlin, grumpy that a sound card took its job. */
function beeper(p: Pal, loud: boolean): Pixels {
  const t = new Pixels(20, 20, CLEAR);
  blob(t, 10, 11, 8, 8, p.r('gray'), 2, 6);
  t.ring(10, 11, 5, p.c('gray', 3));
  for (const [x, y] of [
    [7, 13],
    [10, 15],
    [13, 13],
    [10, 12],
  ])
    t.set(x, y, p.c('gray', 1));
  // angry eyes
  t.rect(5, 7, 4, 3, p.c('gray', 7)).rect(11, 7, 4, 3, p.c('gray', 7));
  t.rect(7, 8, 2, 2, p.c('red', 2)).rect(11, 8, 2, 2, p.c('red', 2));
  t.line(4, 5, 8, 7, p.c('ink', 0)).line(15, 5, 11, 7, p.c('ink', 0));
  outline(t, p.c('ink', 0));
  if (loud) {
    t.rect(1, 0, 18, 7, p.c('ink', 0));
    micro(t, 2, 1, 'BEEP', p.c('gold', 4));
  }
  return t;
}

/** HA: the FM chip's laugh, let loose. */
function ha(p: Pal, k: number): Pixels {
  const t = new Pixels(20, 20, CLEAR);
  text(t, 2, 6 - k, 'HA', k ? p.c('gold', 4) : p.c('pink', 3));
  outline(t, p.c('ink', 0));
  return t;
}

/** A sound wave rolling right out of the line-out jack. */
function wave(p: Pal, k: number): Pixels {
  const t = new Pixels(20, 20, CLEAR);
  for (let i = 0; i < 3; i++) {
    const cx = 2 + i * 5 + k;
    for (let y = 2; y < 18; y++) {
      const x = cx + Math.round(Math.sqrt(Math.max(0, 64 - (y - 10) ** 2)) * 0.5);
      t.rect(x, y, 2, 1, p.c('cyan', 5 - i));
    }
  }
  outline(t, p.c('ink', 0));
  return t;
}

export function boasterVirus(b: Bestiary, p: Pal): void {
  pics(b, 'mite', ...mite(keyOf(p, { main: 'cyan', accent: 'pink' })));
  pics(b, 'beeper', beeper(p, false), beeper(p, true));
  const [n0, n1] = note(keyOf(p, { main: 'virus', accent: 'slime' }));
  pics(b, 'note', n0, n1);
  const [g0, g1] = note(keyOf(p, { main: 'slime', accent: 'virus' }));
  pics(b, 'noteG', g0, g1);
  pics(b, 'ha', ha(p, 0), ha(p, 1));
  pics(b, 'wave', wave(p, 0), wave(p, 1), HURT.hazard);
  pics(b, 'amp', ...bomb(keyOf(p, { main: 'blue', accent: 'red' })));
  pics(b, 'disc', ...disc(p, { main: 'gray', accent: 'cyan' }));
}

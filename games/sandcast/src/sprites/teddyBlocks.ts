// Character blocks (sandcast.cbl): Teddy, a Pembroke Welsh Corgi in a tin helmet, drawn
// from ASCII art in front, back and side views with separate leg rows for the walk steps,
// plus every trick: flinging sand, throwing water, tossing a ball, sit, roll over, hurt
// and tuckered out.
import { CHARBL } from '../../../../web/src/formats/blocks';
import { PINK, RED, SAND, STEEL, TABBY, WATER, WOOD, YELLOW } from '../art/palette';
import { BlockSet } from '../rules';
import { CLEAR, Pixels, art, ball, shade, sprite } from '../art/draw';

// ================================================================= Teddy
export const cb = new BlockSet(CHARBL, true);

// A Pembroke Welsh Corgi: red-and-white, big ears, short legs, in a tin helmet with a red plume.
const K = {
  k: TABBY[0],
  O: TABBY[4],
  o: TABBY[2],
  L: TABBY[5],
  W: STEEL[7],
  w: STEEL[5],
  e: STEEL[0],
  n: STEEL[0],
  p: PINK[2],
  t: PINK[3],
  S: STEEL[5],
  s: STEEL[3],
  h: STEEL[7],
  r: RED[3],
  R: RED[5],
  c: WATER[4],
  y: YELLOW[3],
};

const FRONT = [
  '         rR         ',
  ' kk     rRRr     kk ',
  ' kOk   kkRrkk   kOk ',
  ' kOpk kShSSSsk kpOk ',
  ' kOppkkSSSSSskkppOk ',
  ' kOpppkkkkkkkkpppOk ',
  '  kOOOOOOOOOOOOOOk  ',
  '  kOOWeOOWWOOWeOOk  ',
  '  kOOeeOOWWOOeeOOk  ',
  '  kOOOOOWWWWOOOOOk  ',
  '   kOOWWWnnWWWOOk   ',
  '    kOWWkttkWWOk    ',
  '    kccccyycccck    ',
  '   kOWWWWWWWWWWOk   ',
  '  kOOWWWWWWWWWWOOk  ',
  '  kOOOWWWWWWWWOOOk  ',
  '  koOOkWWWWWWkOOok  ',
];
const FRONT_LEGS = {
  stand: ['    kWWk    kWWk    ', '    kWWk    kWWk    ', '    kkkk    kkkk    '],
  a: ['    kWWk    kWWk    ', '    kkkk    kWWk    ', '            kkkk    '],
  b: ['    kWWk    kWWk    ', '    kWWk    kkkk    ', '    kkkk            '],
};
const BACK = [
  '         rR         ',
  ' kk     rRRr     kk ',
  ' kOk   kkRrkk   kOk ',
  ' kOOk kSSRrSsk kOOk ',
  ' kOOOkkSSRrSskkOOOk ',
  ' kOOOOkkkkkkkkOOOOk ',
  '  kOOOOOOOOOOOOOOk  ',
  '  kOOLOOOOOOOOOOOk  ',
  '  kOOOOOOOOOOOOOOk  ',
  '   kOOOOOOOOOOOOk   ',
  '    kcccccccccck    ',
  '   kOOOOOOOOOOOOk   ',
  '  kOOLOOOOOOOOOOOk  ',
  '  kOOOOOOOOOOOOOOk  ',
  '  kOOOOOOooOOOOOOk  ',
  '  kOOWWWWOOWWWWOOk  ',
  '  kOWWWWWkkWWWWWOk  ',
];
const BACK_LEGS = {
  stand: ['    kOWk    kWOk    ', '    kWWk    kWWk    ', '    kkkk    kkkk    '],
  a: ['    kOWk    kWOk    ', '    kkkk    kWWk    ', '            kkkk    '],
  b: ['    kOWk    kWOk    ', '    kWWk    kkkk    ', '    kkkk            '],
};
const SIDE = [
  '                    ',
  '             rR     ',
  '         kk rRRr    ',
  '         kOkkkRkk   ',
  '         kpOkShSsk  ',
  '         kppkSSSsk  ',
  '         kpOkkkkkkk ',
  '        kOOOOOOeOOk ',
  '        kOOOOOOOOWWk',
  '        kOOOOWWWWWnk',
  '  kkkkkkkOOOWWkkkk  ',
  ' kOOOOOOOOOcWWWk    ',
  ' kOLOOOOOOOcWWWk    ',
  ' kOOOOOOOOOcWWWWk   ',
  ' kWOOOOOOOOOWWWWk   ',
  ' kWWOOOOOOOWWWWWk   ',
  ' kWWWkkkkkkkWWWk    ',
];
const SIDE_LEGS = {
  stand: ['  kWWk     kWWk     ', '  kWWk     kWWk     ', '  kkkk     kkkk     '],
  a: [' kWWk       kWWk    ', 'kWWk         kWWk   ', 'kkk           kkk  '],
  b: ['  kWWk    kWWk      ', '   kWWk   kWWk      ', '   kkkk   kkkk      '],
};

const corgi = (rows: string[], legs: string[]) => art([...rows, ...legs], K);
const sitRows = (): string[] => [
  '',
  ...FRONT.slice(0, 13),
  '   kOWWWWWWWWWWOk   ',
  '  kOOWWWWWWWWWWOOk  ',
  ' kOOOOWWWWWWWWOOOOk ',
  ' kOOOkkWWkkWWkkOOOk ',
  ' kOOOOkWWkkWWkOOOOk ',
  '  kkkkkkkkkkkkkkkk  ',
];

/** A sand-colored bucket handle in Teddy's mouth, the pail hanging below. */
function withBucket(p: Pixels, x: number, y: number): Pixels {
  const b = art([' kkkk', 'k    k', 'kkkkkk', 'kBWWWk', 'kBWWWk', ' kBWk', ' kkkk'], { k: WATER[0], B: WATER[3], W: WATER[5] });
  return p.blit(b, x, y, CLEAR);
}

const STEPS = ['stand', 'a', 'b'] as const;
for (const st of STEPS) cb.add(`down_${st}`, corgi(FRONT, FRONT_LEGS[st]));
for (const st of STEPS) cb.add(`up_${st}`, corgi(BACK, BACK_LEGS[st]));
for (const st of STEPS) cb.add(`right_${st}`, corgi(SIDE, SIDE_LEGS[st]));
// Idle: an ear flick and a head tilt.
{
  const rows = FRONT.slice();
  rows[1] = '  kk    rRRr     kk ';
  rows[2] = '  kOk  kkRrkk   kOk ';
  rows[3] = '  kpOk kShSSSsk kpOk';
  cb.add('idle_sway', corgi(rows, FRONT_LEGS.stand));
}
// Flinging sand: the toy shovel in his teeth, back over his head, then forward with a spray.
{
  const p = corgi(FRONT, FRONT_LEGS.stand);
  p.line(10, 11, 16, 2, WOOD[5]).line(11, 11, 17, 2, WOOD[3]);
  p.rect(15, 0, 4, 3, RED[4]).set(15, 0, RED[6]);
  cb.add('fling_back', p);
  const q = corgi(FRONT, FRONT_LEGS.stand);
  q.line(10, 11, 15, 17, WOOD[5]).line(11, 11, 16, 17, WOOD[3]);
  q.rect(14, 16, 4, 4, RED[4]).set(14, 16, RED[6]);
  for (const [x, y] of [
    [18, 13],
    [19, 15],
    [17, 11],
    [19, 18],
  ])
    q.set(x, y, SAND[7]);
  cb.add('fling_fwd', q);
}
// Throwing water: bucket swung up by the handle, then tipped out.
{
  cb.add('splash_up', withBucket(corgi(FRONT, FRONT_LEGS.stand), 12, 5));
  const q = withBucket(corgi(FRONT, FRONT_LEGS.stand), 13, 10);
  for (const [x, y] of [
    [19, 9],
    [18, 7],
    [19, 6],
    [17, 5],
  ])
    q.set(x, y, WATER[7]);
  cb.add('splash_out', q);
}
// Tossing a tennis ball: a ball in his mouth, then a flick of the head.
{
  const p = corgi(FRONT, FRONT_LEGS.stand);
  ball(p, 10, 12, 2.6, YELLOW, 3);
  p.set(9, 11, STEEL[7]);
  cb.add('toss0', p);
  const rows = FRONT.slice();
  rows[11] = '    kOWWkppkWWOk    ';
  const q = corgi(rows, FRONT_LEGS.stand);
  ball(q, 16, 3, 2.4, YELLOW, 3);
  q.line(13, 7, 15, 5, STEEL[6]);
  cb.add('toss1', q);
}
// Sit: haunches down, front paws together, a proud chest; then a paw up to shake.
cb.add('sit0', art(sitRows(), K));
{
  const rows = sitRows();
  rows[14] = '   kOWWWWWWWWWWOkk  ';
  rows[15] = '  kOOWWWWWWWWWkWWk  ';
  rows[16] = ' kOOOOWWWWWWWkWWkOk ';
  rows[17] = ' kOOOkkWWkk  kkkOOk ';
  cb.add('sit1', art(rows, K));
}
// Rolling over: the side view turned a quarter at a time, belly up halfway round.
/** Turns a 20x20 sprite clockwise by `q` quarter turns. */
function turn(p: Pixels, q: number): Pixels {
  const out = sprite();
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      let [sx, sy] = [x, y];
      for (let k = 0; k < q; k++) [sx, sy] = [sy, 19 - sx];
      out.set(x, y, p.get(sx, sy));
    }
  return out;
}
{
  const side = corgi(SIDE, SIDE_LEGS.stand);
  // Shifted so he rolls about the middle of his body, not the corner of the block.
  cb.add('roll1', turn(side, 1));
  cb.add('belly', turn(side, 2));
  cb.add('roll3', turn(side, 3));
  // Play dead: belly up, eyes X-ed out, tongue lolling.
  const rows = SIDE.slice();
  rows[6] = '         kpOkkkkkkk ';
  rows[7] = '        kOOOOOkOkOk ';
  rows[8] = '        kOOOOOOkOWWk';
  rows[9] = '        kOOOOWkOkWnk';
  rows[10] = '  kkkkkkkOOOWWkkttk ';
  rows[11] = ' kOOOOOOOOOcWWWk tt ';
  cb.add('dead', turn(corgi(rows, SIDE_LEGS.stand), 2));
}
// Hurt: a flash of white, then red.
cb.add(
  'hurt_white',
  corgi(FRONT, FRONT_LEGS.stand).map((_x, _y, c) => (c === CLEAR ? c : c === K.k ? STEEL[4] : STEEL[7])),
);
cb.add(
  'hurt_red',
  corgi(FRONT, FRONT_LEGS.stand).map((_x, _y, c) => (c === CLEAR ? c : c === K.k ? RED[0] : shade(RED, 3 + (c === K.W ? 2 : 0)))),
);
// Tuckered out: Teddy wobbles, flops, and lies there with stars going round his helmet.
{
  cb.add('die0', corgi(FRONT, FRONT_LEGS.stand).flipX());
  cb.add('die1', turn(corgi(SIDE, SIDE_LEGS.stand), 1));
  cb.add('die2', cb.pic('dead'));
  const stars = sprite().blit(cb.pic('dead'), 0, 0);
  for (const [x, y] of [
    [4, 0],
    [11, 2],
    [17, 0],
  ])
    stars
      .set(x, y, YELLOW[4])
      .set(x - 1, y + 1, YELLOW[3])
      .set(x + 1, y + 1, YELLOW[3])
      .set(x, y + 2, YELLOW[4]);
  cb.add('die3', stars);
}

// Doc Leo, the friendly hobo clown, two blocks tall (Teddy is one), as the hero of his own
// MEANWHILE... levels and standing by THE CHEZ: a felt fedora with a dark band, wire glasses,
// white makeup patches round both eyes and round the mouth, bold painted brows, painted gray
// stubble all round the jaw, his own nose and cheeks sunburned pink (a hobo wears no clown
// nose), a lavender shirt with a green tie and blue suspenders under a navy jacket, patched
// trousers, red sneakers, and his rubber chicken on its short leash. He is always smiling.
import { Pixels } from '../../../kit/pixels';
import { CLEAR, over, sprite } from '../art/draw';
import { P } from '../art/pal';
import { CK } from './klown';

const c = (n: string, k: number) => P.c(n, k);

const K: Record<string, number> = {
  ...CK,
  // the fedora's felt and band, the stubble, the white makeup, sunburn
  k: c('stone', 1),
  K: c('stone', 2),
  z: c('ink', 1),
  u: c('stone', 2),
  U: c('stone', 3),
  W: c('fur', 2),
  N: c('tongue', 1),
  a: c('pink', 2),
  // the navy jacket, the lavender shirt, the suspenders, the trousers and their patch
  x: c('blue', 0),
  X: c('blue', 1),
  c: c('blue', 2),
  v: c('lilac', 2),
  V: c('lilac', 3),
  t: c('asphalt', 1),
  T: c('asphalt', 2),
  d: c('wood', 3),
};

const HAT = ['......oooooo........', '.....okkKkkko.......', '.....okkkkkko.......', '.....ozzzzzzo.......', '..ooOkkkkkkkkOoo....'];
const FACE = [
  '....osSSSSSSSSso....',
  '....oooosSSsoooo....',
  '....mWWWmSSmWWWm....',
  '....mWoWmmmmWoWm....',
  '....oWWWsNNsWWWo....',
  '....oausNNNNsuao....',
  '....ouuWWWWWWuuo....',
  '....ouuWooooWuuo....',
  '....ouuuWWWWuuuo....',
  '.....ouuuuuuuuo.....',
  '......ouuuuuuo......',
];
const BLINK = FACE.map((r, i) => (i === 3 ? '....mWWWmmmmWWWm....' : r));
const OUCH = FACE.map((r, i) => (i === 3 ? '....mWoWmmmmWoWm....'.replace(/o/g, 'z') : i === 7 ? '....ouuWWooWWuuo....' : r));
const TORSO = [
  '..oxxxowvGGvwoxxxo..',
  '.oxXxxocvGGvcoxxXxo.',
  'oxxxxxocvgGvcoxxxxxo',
  'oxXxxxocvGgvcoxxxXxo',
  'oxxoxxocvgGvcoxxoxxo',
  'oxXoxxocvvGvcoxxoXxo',
  'oxxoxxocvvvvcoxxoxxo',
  'oxxoXxxxxxxxxxXxoxxo',
  'oSSoxxxxxxxxxxxxoSSo',
  '.oo.oxxxxxxxxxxo.oo.',
];
const LEGS = [
  '.....otttttttttto...',
  '.....otttttottTto...',
  '.....otddttottttto..',
  '.....otddttotttto...',
  '.....ottttootttto...',
  '.....otttto.otttto..',
  '.....ottTto.otttto..',
  '.....otttto.ottTto..',
  '.....otttto.otttto..',
  '.....ooooo...ooooo..',
];
const SHOES = ['...oRRwRo..oRwRRo...', '..oRRRRRRo.oRRRRRRo.', '..owwwwwwo.owwwwwwo.', '..oooooooo.oooooooo.'];
// mid-stride: the front leg out, the back one behind
const STRIDE = [
  '.....otttttttttto...',
  '.....otttttottTto...',
  '....otddtto.ottttto.',
  '....otddtto..otttto.',
  '...ottttto...ottttto',
  '...otttto.....otttto',
  '..ottTto......ottto.',
  '..otttto.......ottto',
  '.otttto........otto.',
  '.ooooo.........oooo.',
];
const STRIDE_SHOES = ['oRRwRo.........oRwRo', 'RRRRRo........oRRRRo', 'wwwwwo........owwwwo', 'ooooo.........ooooo.'];
const PASS = [
  '.....otttttttttto...',
  '.....otttttttTto....',
  '......otddtttto.....',
  '......otddtttto.....',
  '......otttttto......',
  '......otttttto......',
  '......ottTttto......',
  '......otttttto......',
  '......ottttTto......',
  '......oooooooo......',
];
const PASS_SHOES = ['.....oRRwRRRo.......', '....oRRRRRRRRo......', '....owwwwwwwwo......', '....oooooooooo......'];

/** Rows mirrored left to right (the other leg's turn). */
const mirrorRows = (rows: string[]) => rows.map((r) => [...r].reverse().join(''));
// the other mid-stride (the patched leg behind now), and passing on the other leg (the patch
// and the lit heel swap sides); the strides drop him a pixel lower than the passes, so he bobs
const STRIDE_B = mirrorRows(STRIDE);
const STRIDE_B_SHOES = mirrorRows(STRIDE_SHOES);
const PASS_B = [
  '.....otttttttttto...',
  '.....oTttttttttto...',
  '......otttttddto....',
  '......otttttddto....',
  '......otttttto......',
  '......otttttto......',
  '......otttTtto......',
  '......otttttto......',
  '......oTttttto......',
  '......oooooooo......',
];
const PASS_B_SHOES = ['......oRRRwRRo......', '.....oRRRRRRRRo.....', '.....owwwwwwwwo.....', '.....oooooooooo.....'];
/** A stride's legs, one row shorter (the hip row doubled up): he is lowest at a stride. */
const low = (legs: string[]) => [legs[0], ...legs.slice(2)];

/** Overwrites part of an ASCII row. */
const patch = (row: string, x: number, s: string) => row.slice(0, x) + s + row.slice(x + s.length);

/** The rubber chicken in its red harness, hanging on its leash from his left fist. */
function chicken(rows: string[], swing = 0): void {
  const hen = ['..rr.', '.oYYo', 'eeoYo', '..rYo', '..oYo', '.oYYq', 'oYqqq', 'oYYYo', '.oYo.', '.j.j.'];
  rows[25] = patch(rows[25], 3, 'q');
  for (let i = 26; i < 28 + swing; i++) rows[i] = patch(rows[i], 4, 'q');
  hen.forEach((h, i) => (rows[27 + swing + i] = patch(rows[27 + swing + i], 0, h)));
}

function figure(face: string[], legs: string[], shoes: string[], o: { swing?: number; noChicken?: boolean } = {}): string[] {
  const rows = [...HAT, ...face, ...TORSO, ...legs, ...shoes];
  if (!o.noChicken) chicken(rows, o.swing ?? 0);
  return rows;
}

const S = (rows: string[]) => sprite(rows, K, 0, 40 - rows.length, 20, 40);

/** Doc Leo standing, facing you; `wave` lifts his right hand (hello!). */
export function docLeo(wave = false, face = FACE): Pixels {
  const rows = figure(face, LEGS, SHOES);
  if (wave) {
    rows[13] = patch(rows[13], 17, 'oSo');
    rows[14] = patch(rows[14], 17, 'oSo');
    rows[15] = patch(rows[15], 16, 'oxxo');
    rows[16] = patch(rows[16], 16, 'oxxo');
    rows[17] = patch(rows[17], 16, 'xxo.');
    for (let i = 22; i < 25; i++) rows[i] = patch(rows[i], 16, '....');
  }
  return S(rows);
}

/** Squeezing the chicken: held up high in his right hand, beak wide open. */
function squawk(): Pixels {
  const rows = figure(FACE, LEGS, SHOES, { noChicken: true });
  rows[11] = '....ouuWoWWoWuuo....';
  const hen = ['.rr..', 'oYYo.', 'oYoee', 'oYo..', 'oYYq.', 'qqqYo', 'oYYYo', '.oYo.'];
  hen.forEach((h, i) => (rows[3 + i] = patch(rows[3 + i], 15, h)));
  for (let i = 11; i < 16; i++) rows[i] = patch(rows[i], 16, 'oSo');
  rows[16] = patch(rows[16], 16, 'oxxo');
  rows[17] = patch(rows[17], 16, 'xxo.');
  for (let i = 22; i < 25; i++) rows[i] = patch(rows[i], 16, '....');
  return S(rows);
}

/** Twisting a balloon dog: both hands up at his chest round a long pink balloon. */
function twist(phase: number): Pixels {
  const rows = figure(FACE, LEGS, SHOES);
  const loop = phase ? '.oPPPPo.' : 'oPPoPPPo';
  rows[17] = patch(rows[17], 6, '.oPPPo..');
  rows[18] = patch(rows[18], 6, loop);
  rows[19] = patch(rows[19], 6, 'oSPPPPSo');
  rows[20] = patch(rows[20], 6, '.oPPPPo.');
  return S(rows);
}

/** Up in a hop: knees tucked, arms out. */
function hop(): Pixels {
  const legs = [
    '.....otttttttttto...',
    '....otttttottTtto...',
    '...otddtto.otttto...',
    '...oRRwRo..oRwRRo...',
    '..oRRRRRRooRRRRRRo..',
    '..owwwwwwo.owwwwwwo.',
    '..oooooooo.oooooooo.',
  ];
  return sprite([...HAT, ...FACE, ...TORSO, ...legs], K, 0, 0, 20, 40);
}

/** The pratfall: flat on his back (one block high), hat over his face, the chicken on his chest. */
function pratfall(): Pixels {
  const rows = [
    '....................',
    '....................',
    '....................',
    '....................',
    '....................',
    '....................',
    '..................oo',
    '....oooooo...rr..oRo',
    '...okkkkkko.oYYooRRo',
    '..oozzzzzzoeeoYooRo.',
    'ooOkkkkkkkkOoYYqottt',
    'oSSuuWWWuuxxoqqqottt',
    'oSuWooWuuxxcGGvtTtto',
    'oSSuWWWuuxxcvvvtttto',
    '.oooooooooxxxxxoooo.',
    '....................',
    '....................',
    '....................',
    '....................',
    '....................',
  ];
  return sprite(rows, K, 0, 0, 20, 20);
}

/** Asleep sitting against nothing at all (out of energy): the die sequence's last pose. */
function sleepy(): Pixels {
  const rows = [...HAT, ...BLINK, ...TORSO, ...PASS, ...PASS_SHOES];
  return S(rows);
}

/** Every pose, 20x40 (the pratfall is 20x20: only his bottom block). */
export const LEO: Record<string, Pixels> = {
  front: docLeo(),
  frontBlink: docLeo(false, BLINK),
  wave: docLeo(true),
  hurt: docLeo(false, OUCH),
  // the walk: stride, pass, the other stride, pass on the other leg (the chicken swings)
  walk1: S(figure(FACE, low(STRIDE), STRIDE_SHOES, { swing: 1 })),
  walk2: S(figure(FACE, PASS, PASS_SHOES)),
  walk3: S(figure(FACE, low(STRIDE_B), STRIDE_B_SHOES, { swing: 2 })),
  walk4: S(figure(FACE, PASS_B, PASS_B_SHOES, { swing: 1 })),
  hop: hop(),
  squawk: squawk(),
  twist1: twist(0),
  twist2: twist(1),
  sleep: sleepy(),
};
export const LEO_FLAT = pratfall();

/** Doc Leo drawn over a background picture 20 wide and 40 tall, cut into [top, bottom] blocks. */
export function leoOn(pose: Pixels, top: Pixels, bottom: Pixels): [Pixels, Pixels] {
  const a = new Pixels(20, 20);
  a.px.set(top.px);
  over(a, pose.crop(0, 0, 20, 20));
  const b = new Pixels(20, 20);
  b.px.set(bottom.px);
  over(b, pose.crop(0, 20, 20, 20));
  return [a, b];
}

export { CLEAR };

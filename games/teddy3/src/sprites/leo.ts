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

// Side on, walking to the right (mirrored for the left): the fedora's long front brim, the white
// patch round his eye behind the glasses, the sunburned nose out front, stubble along the jaw,
// the tie peeking past the jacket, and the chicken trotting behind on its leash.
const SIDE_HAT = ['.......oooooo.......', '......okkKkkko......', '......okkkkkkko.....', '......ozzzzzzzo.....', '....oOkkkkkkkkkOooo.'];
const SIDE_FACE = [
  '......osSSSSSSSo....',
  '.....osSSSmmmmmmo...',
  '.....oSSsSSmWWWm....',
  '.....osOsSSmWoWm....',
  '.....osssSSSWWWso...',
  '.....oSSSSSaSNNNo...',
  '.....ouSSSSaSNNNNo..',
  '.....ouuuSSWWWWoo...',
  '.....ouuuuWooWWo....',
  '......ouuuuWWWuo....',
  '.......ouuuuuuo.....',
];
const SIDE_BLINK = SIDE_FACE.map((r, i) => (i === 3 ? '.....osOsSSmWWWm....' : r));
/** The jacket from the side, his near arm swung back (hand at `hand`: 0 back, 1 by his side). */
function sideTorso(hand: number): string[] {
  const back = [
    '.......oxxxvGGo.....',
    '......oxXxxvGvo.....',
    '......oxxxxcGvo.....',
    '.....oxxXxxcvvo.....',
    '.....oxxoxxcvvo.....',
    '....oxxo.oxxxxo.....',
    '....oxxo.oxxxxo.....',
    '...oxxo..oxxxxo.....',
    '...oSSo..oxXxxo.....',
    '....oo...oxxxxo.....',
  ];
  const side = [
    '.......oxxxvGGo.....',
    '......oxXxxvGvo.....',
    '......oxxxxcGvo.....',
    '......oxxoxcvvo.....',
    '......oxxoxcvvo.....',
    '......oxxoxxxxo.....',
    '......oxXoxxxxo.....',
    '......oxxoxxxxo.....',
    '......oSSoxXxxo.....',
    '.......oooxxxxo.....',
  ];
  return hand ? side : back;
}
// mid-stride (the near, patched leg out front) and passing; the far leg is the darker one
const SIDE_STRIDE = [
  '.........ottttto....',
  '........otTTtttto...',
  '.......oTTTo.ottto..',
  '.......oTTo..otddo..',
  '......oTTo...otddo..',
  '......oTTo...otttto.',
  '.....oTTo.....ottto.',
  '.....oTTo.....ottto.',
  '....oTTo......ottto.',
  '....oooo......ooooo.',
];
const SIDE_STRIDE_SHOES = ['..oRRo........oRRwo.', '.oRRRo.......oRRRRo.', '.owwwo.......owwwwo.', '.oooo........oooooo.'];
const SIDE_PASS = [
  '.........ottttto....',
  '.........otTtttto...',
  '.........oTTtddo....',
  '.........oTTtddo....',
  '.........oTTttto....',
  '.........oTtttto....',
  '.........oTtttto....',
  '.........oTtttto....',
  '.........oTtttto....',
  '.........oooooooo...',
];
const SIDE_PASS_SHOES = ['.........oRRRRwRo...', '.........oRRRRRRRo..', '.........owwwwwwwo..', '.........ooooooooo..'];
/** The other stride: the far leg out front now, the patched one behind. */
const SIDE_STRIDE_B = [
  '.........ottttto....',
  '........otttttTTo...',
  '.......ottto.oTTo...',
  '.......otddo..oTTo..',
  '......otddo...oTTTo.',
  '......otto.....oTTo.',
  '.....ottto.....oTTo.',
  '.....ottto.....oTTo.',
  '....ottto......oTTo.',
  '....ooooo......oooo.',
];
const SIDE_PASS_B = SIDE_PASS.map((r) => r.replace(/t/g, '#').replace(/T/g, 't').replace(/#/g, 'T').replace(/dd/g, 'TT'));

/** The rubber chicken trotting behind him on its leash, from the hand at his side or swung back. */
function sideChicken(rows: string[], hand: number, bob = 0): void {
  const hen = ['.rr..', 'oYYo.', 'oYoee', 'oYr..', 'oYo..', 'qYYo.', 'qqqYo', 'oYYYo', '.oYo.', '.j.j.'];
  const top = rows.length - hen.length - bob;
  // the leash runs from his fist (row 24) down and back to the hen's harness
  const fist = hand ? 8 : 4;
  for (let y = 25, x = fist; y < top + 3; y++, x = Math.max(3, x - 1)) rows[y] = patch(rows[y], x, 'q');
  hen.forEach((h, i) => (rows[top + i] = patch(rows[top + i], 0, h)));
}

function sideFigure(face: string[], hand: number, legs: string[], shoes: string[], bob = 0): Pixels {
  const rows = [...SIDE_HAT, ...face, ...sideTorso(hand), ...legs, ...shoes];
  sideChicken(rows, hand, bob);
  return S(rows);
}

/** A side-on hop: knees tucked, the chicken swinging under him. */
function sideHop(): Pixels {
  const legs = [
    '.........ottttto....',
    '........otTTtttto...',
    '.......oTTo.otddto..',
    '.......oTTo.otddtto.',
    '......oRRRw.oRRRRw..',
    '......owwwwooRRRRRR.',
    '......ooooo.owwwwwo.',
    '.............oooooo.',
  ];
  return sprite([...SIDE_HAT, ...SIDE_FACE, ...sideTorso(0), ...legs], K, 0, 0, 20, 40);
}

/** Every pose, 20x40 (the pratfall is 20x20: only his bottom block). */
export const LEO: Record<string, Pixels> = {
  front: docLeo(),
  frontBlink: docLeo(false, BLINK),
  wave: docLeo(true),
  hurt: docLeo(false, OUCH),
  hop: hop(),
  squawk: squawk(),
  twist1: twist(0),
  twist2: twist(1),
  sleep: sleepy(),
  // the walk, side on to the right: stride, pass, the other stride, pass on the other leg
  side1: sideFigure(SIDE_FACE, 0, low(SIDE_STRIDE), SIDE_STRIDE_SHOES, 1),
  side2: sideFigure(SIDE_FACE, 1, SIDE_PASS, SIDE_PASS_SHOES),
  side3: sideFigure(SIDE_BLINK, 0, low(SIDE_STRIDE_B), SIDE_STRIDE_SHOES, 2),
  side4: sideFigure(SIDE_FACE, 1, SIDE_PASS_B, SIDE_PASS_SHOES, 1),
  sideHop: sideHop(),
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

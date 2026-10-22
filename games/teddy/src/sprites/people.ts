// Doc Leo, the friendly hobo clown, two blocks tall (Teddy is one): a chewed-up felt
// fedora, wire glasses, an ash-gray painted beard round a white mouth, a purple shirt with
// a green tie and blue suspenders, a navy corduroy jacket, red sneakers, and a rubber
// chicken on a dog leash. Gwinn scattered the costume across town; `wearing` says which
// pieces he has on.
import { Pixels } from '../../../kit/pixels';
import { CLEAR, over, sprite } from '../art/draw';
import { CK } from './klown';
import { P } from '../art/pal';

const K: Record<string, number> = {
  ...CK,
  // ash beard paint, the felt hat, the corduroy, the shirt, cheeks
  u: P.c('stone', 1),
  U: P.c('stone', 3),
  m: P.c('metal', 2),
  k: P.c('stone', 1),
  x: P.c('blue', 0),
  X: P.c('blue', 1),
  c: P.c('blue', 2),
  v: P.c('purple', 2),
  V: P.c('purple', 3),
  d: P.c('gwinn', 1),
  a: P.c('pink', 2),
  t: P.c('asphalt', 1),
  T: P.c('asphalt', 2),
};

export interface Costume {
  hat?: boolean;
  tie?: boolean;
  shoes?: boolean;
  chicken?: boolean;
  nose?: boolean;
}

export const FULL: Costume = { hat: true, tie: true, shoes: true, chicken: true, nose: true };

/** Overwrites part of an ASCII row. */
const patch = (row: string, x: number, s: string) => row.slice(0, x) + s + row.slice(x + s.length);

/** Doc Leo as a 20x40 picture (clear background). `wave` raises his hand. */
export function docLeo(wearing: Costume = FULL, wave = false): Pixels {
  const R = wearing.nose ? 'R' : 's';
  const rows = [
    // the fedora, chewed at the brim (or his own shaggy gray hair)
    ...(wearing.hat
      ? ['......oooooo........', '.....okkOkkko.......', '.....okkkkkko.......', '.....oooooooo.......', '..ooOkkkkkkkkOoo....']
      : ['....................', '....................', '.....ooooooo........', '....okuukkuuko......', '....okkuukkkuo......']),
    // the face: thick brows, glasses, rosy cheeks, the nose, a sad white mouth in an ash beard
    '....osSSSSSSSSso....',
    '....oooosSSsoooo....',
    '....omwowmmmwowmo...',
    '....oammmssmmmao....',
    `....oaas${R}${R}ssaaso....`.slice(0, 20),
    `....ous${R}${R}${R}${R}ssuo....`,
    '....ouuuwwwwuuuo....',
    '....ouuwoooowuuo....',
    '....ouuowwwwouuo....',
    '.....ouuuwwuuuo.....',
    '......ouuuuuuo......',
    // collar and tie, suspenders, the corduroy jacket
    wearing.tie ? '..oxxxowvGGvwoxxxo..' : '..oxxxowvvvvwoxxxo..',
    wearing.tie ? '.oxXxxocvGGvcoxxXxo.' : '.oxXxxocvvvvcoxxXxo.',
    wearing.tie ? 'oxxxxxocvgGvcoxxxxxo' : 'oxxxxxocvvvvcoxxxxxo',
    wearing.tie ? 'oxXxxxocvGgvcoxxxXxo' : 'oxXxxxocvvvvcoxxxXxo',
    wearing.tie ? 'oxxoxxocvgGvcoxxoxxo' : 'oxxoxxocvvvvcoxxoxxo',
    wearing.tie ? 'oxXoxxocvvGvcoxxoXxo' : 'oxXoxxocvvvvcoxxoXxo',
    'oxxoxxocvvvvcoxxoxxo',
    'oxxoXxxxxxxxxxXxoxxo',
    'oSSoxxxxxxxxxxxxoSSo',
    '.oo.oxxxxxxxxxxo.oo.',
    // patched trousers
    '.....otttttttttto...',
    '.....otttttottTto...',
    '.....otUUttottttto..',
    '.....otUUttotttto...',
    '.....ottttootttto...',
    '.....otttto.otttto..',
    '.....ottTto.otttto..',
    '.....otttto.ottTto..',
    '.....otttto.otttto..',
    '.....ooooo...ooooo..',
    // red sneakers (or his darned socks)
    ...(wearing.shoes
      ? ['...oRRwRo..oRwRRo...', '..oRRRRRRo.oRRRRRRo.', '..owwwwwwo.owwwwwwo.', '..oooooooo.oooooooo.']
      : ['....oddddo..oddddo..', '....odoodo..odoodo..', '....oddddo..oddddo..', '....oooooo..oooooo..']),
  ];
  if (wearing.chicken) {
    // the rubber chicken in its red harness, dangling from his fist on its short leash
    const hen = ['..rr.', '.oYYo', 'eeoYo', '..rYo', '..oYo', '.oYYq', 'oYqqq', 'oYYYo', '.oYo.', '.j.j.'];
    rows[25] = patch(rows[25], 3, 'q');
    for (let i = 26; i < 32; i++) rows[i] = patch(rows[i], 4, 'q');
    hen.forEach((h, i) => (rows[27 + i] = patch(rows[27 + i], 0, h)));
  }
  if (wave) {
    // the right hand up: hello!
    rows[12] = patch(rows[12], 17, 'oSo');
    rows[13] = patch(rows[13], 17, 'oSo');
    rows[14] = patch(rows[14], 16, 'oxxo');
    rows[15] = patch(rows[15], 16, 'oxxo');
    rows[16] = patch(rows[16], 16, 'xxo.');
    for (let i = 21; i < 26; i++) rows[i] = patch(rows[i], 16, i < 25 ? 'o...' : '....');
  }
  return sprite(rows, K, 0, 40 - rows.length, 20, 40);
}

/** The two halves of a 20x40 picture over background blocks. */
export function halves(fig: Pixels, top: Pixels, bottom: Pixels): [Pixels, Pixels] {
  const a = new Pixels(20, 20);
  a.px.set(top.px);
  over(a, fig.crop(0, 0, 20, 20));
  const b = new Pixels(20, 20);
  b.px.set(bottom.px);
  over(b, fig.crop(0, 20, 20, 20));
  return [a, b];
}

export { CLEAR };

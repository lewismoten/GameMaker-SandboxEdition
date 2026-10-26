// Doc Leo from the side, walking right, for the cast stage: the games only draw him facing you
// (games/teddy/src/sprites/people.ts docLeo) or half his size (Shakespeare in Sweatpants), so
// this draws his walk to match docLeo(): the same 20x40, the same colors (Teddy's palette) and
// the same costume: chewed felt fedora, wire glasses, white makeup round his eye and his mouth,
// his own nose and cheek sunburned pink, painted gray stubble, navy corduroy jacket over a
// purple shirt, green tie, blue suspenders, patched trousers, red sneakers, and the rubber
// chicken trotting behind on its leash. (The face is Teddy's Little Biggest Adventure's side
// view, games/teddy3/src/sprites/leo.ts.)
import { Pixels } from '../../games/kit/pixels';
import { CLEAR, outline } from '../../games/teddy/src/art/draw';
import { CK } from '../../games/teddy/src/sprites/klown';
import { P } from '../../games/teddy/src/art/pal';

// docLeo's own colors (people.ts K)
const K: Record<string, number> = {
  ...CK,
  u: P.c('stone', 2),
  U: P.c('stone', 3),
  m: P.c('metal', 2),
  k: P.c('stone', 1),
  x: P.c('blue', 0),
  X: P.c('blue', 1),
  c: P.c('blue', 2),
  v: P.c('purple', 2),
  a: P.c('pink', 2),
  N: P.c('tongue', 1),
  t: P.c('asphalt', 1),
  T: P.c('asphalt', 2),
};

// head and body, facing right (the brim and the nose stick out in front)
const HAT = ['.......oooooo.......', '......okkOkkko......', '......okkkkkko......', '......oooooooo......', '....ooOkkkkkkkOooo..'];
// his own shaggy gray hair, when Gwinn has the hat
const HAIR = ['....................', '....................', '.......oooooo.......', '......okuukkuo......', '.....okkuukkkuo.....'];
const TOP = [
  ...HAT,
  '......osSSSSSSSo....',
  '.....osSSSmmmmmmo...',
  '.....oSSsSSmwwwm....',
  '.....osOsSSmwowm....',
  '.....osssSSSwwwso...',
  '.....oSSSSSaSNNNo...',
  '.....ouSSSSaSNNNNo..',
  '.....ouuuSSwwwwoo...',
  '.....ouuuuwoowwo....',
  '......ouuuuwwwuo....',
  '.......ouuuuuuo.....',
  '.......oxxxxvGo.....',
  '......oxxXxxvGGo....',
  '......oxxxxxcvGo....',
  '......oxXxxxcvGo....',
  '......oxxxxxcvGo....',
  '......oxxXxxcvvo....',
  '......oxxxxxcvvo....',
  '......oxxxxxxxxo....',
  '......oSSxxxxxxo....',
  '.......oxxxxxxo.....',
];

// the hen trotting behind, two steps
const HEN = [
  ['..r...', '.oYo..', 'oYYYe.', 'oYYYo.', '.oYYYo', '..oYo.', '..j.j.'],
  ['..r...', '.oYo..', 'oYYYe.', 'oYYYo.', '.oYYYo', '..oYo.', '...j..'],
];

/** One stride: where the back and front feet are (x of the heel), and how high the body bobs. */
const STEPS: [back: number, front: number, bob: number][] = [
  [4, 13, 0],
  [8, 10, 1],
  [13, 4, 0],
  [10, 8, 1],
];

function leg(p: Pixels, hip: number, foot: number, col: number, top: number): void {
  for (let y = top; y < 36; y++) {
    const x = Math.round(hip + ((foot - hip) * (y - top)) / (36 - top));
    p.rect(x, y, 3, 1, col);
  }
  // the red sneaker, toe forward
  p.rect(foot, 36, 5, 2, K.R)
    .rect(foot + 1, 36, 1, 1, K.w)
    .rect(foot, 38, 6, 1, K.w);
}

/** Frame `n` (0-3) of Doc Leo walking right, 20x40, CLEAR around him. */
export function docLeoWalk(n: number, hat = true): Pixels {
  const [back, front, bob] = STEPS[n % STEPS.length];
  const fig = new Pixels(20, 40, CLEAR);
  const top = 26 + bob;
  // the back leg in shadow, then the front one
  leg(fig, 8, back, K.T, top);
  leg(fig, 9, front, K.t, top);
  fig.rect(8, top, 6, 2, K.t);
  fig.draw(0, bob, hat ? TOP : [...HAIR, ...TOP.slice(HAT.length)], K);
  // the leash from his hand down to the hen behind him
  const hen = HEN[n % 2];
  fig.draw(0, 33, hen, K);
  fig.line(7, 24 + bob, 3, 33, K.q);
  return outline(fig, K.o);
}

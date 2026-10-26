// The people of Procrastia, facing you: a head (hat, hair, face), a body and legs drawn as
// ASCII art, each colored by its own key, and a blink for the second frame of their idle
// animation. Plus the cameos: Doc Leo the hobo clown (grey felt fedora, navy corduroy, purple
// shirt, green tie, red sneakers, a rubber chicken on a leash), Teddy the corgi and Gwinn, THE
// CHEZ's owner, Will the playwright from Shakespeare in Sweatpants, Mystery Robot Joe from
// Keep It Brief!, Teenage Lewie from Snowbound, and Lord Deadline himself.
import { art, lookKey, baseKey, R, type Key } from '../art/sprite';
import { C } from '../art/pal';
import type { Canvas, RGB } from '../art/rgb';

// ---------------------------------------------------------------- heads (rows 0-11)
const FACE = ['....KhHsSSSSsHhK....', '....KHsSeSSeSsHK....', '....KHsSeSSeSsHK....', '.....KsSSddSSsK.....', '.....KKssSSssKK.....'];

const HEADS: Record<string, string[]> = {
  bun: [
    '....................',
    '.........KKK........',
    '........KjjjK.......',
    '.......KKHjHKK......',
    '.....KKhHHHHHhKK....',
    '....KhHHjjjjHHHhK...',
    '....KhHHHHHHHHHhK...',
    ...FACE,
  ],
  crown: [
    '......Ky.Ky.yK......',
    '......KyKyyKyK......',
    '.....KyTyTTyTyK.....',
    '.....KTTTTTTTTK.....',
    '....KhhhhhhhhhhK....',
    '....KhHHHHHHHHhK....',
    '....KhHjjjjjjHhK....',
    ...FACE.slice(0, 3),
    '....KjsSSddSSsjK....',
    '.....KjjjSSjjjK.....',
  ],
  helmet: [
    '....................',
    '.......KKKKKK.......',
    '.....KKMMMMmmmKK....',
    '....KMMMMMMmmmmmK...',
    '....KMMMMMmmmmmmK...',
    '....KmmmmmmmmmmmK...',
    '....KmKKKKKKKKKmK...',
    '....KmsSSSSSSsmK....',
    '....KmsSeSSeSsmK....',
    '....KmsSeSSeSsmK....',
    '.....KsSSddSSsK.....',
    '.....KKssSSssKK.....',
  ],
  bald: [
    '....................',
    '....................',
    '........KKKK........',
    '......KKsSSSKK......',
    '.....KsSSSSSSsK.....',
    '....KsSSSSSSSSsK....',
    '....KhsSSSSSSshK....',
    '....KhsSSSSSSshK....',
    '....KsSeSSSSeSsK....',
    '....KsSeSSSSeSsK....',
    '....KhhhSddShhhK....',
    '.....KhhhhhhhhK.....',
  ],
  hood: [
    '....................',
    '.......KKKKKK.......',
    '.....KKcCCCCCcKK....',
    '....KcCCCCCCCCCcK...',
    '....KcCCCKKKKCCcK...',
    '....KcCKsSSSSKCcK...',
    '....KcKsSSSSSSKcK...',
    '....KcKSeSSSeSKcK...',
    '....KcKSeSSSeSKcK...',
    '....KcKhjjjjjjhKK...',
    '.....KKhjjjjjjhK....',
    '......KKhjjjjhKK....',
  ],
  fedora: [
    '....................',
    '......KKKKKKK.......',
    '.....KCCCCCCCK......',
    '.....KCyoCyCCK......',
    '...KKcccccccccKK....',
    '..KCCCCCCCCCCCCCK...',
    '...KKKKKKKKKKKKK....',
    '....KhsSSSSSShK.....',
    '....KswwSSSwwsK.....',
    '....KseSSqqSeSK.....',
    '....KhhwwwwwhhK.....',
    '.....KhhhhhhhK......',
  ],
  captain: [
    '....................',
    '......KKKKKKK.......',
    '....KKcCCCCCCcKK....',
    '...KcCCCCyyCCCCcK...',
    '...KcCCCCyyCCCCcK...',
    '..KKKKKKKKKKKKKKKK..',
    '....KhhHsSSsHhhK....',
    ...FACE,
  ],
  goggles: [
    '....................',
    '...K.KK.KK.KK.K.....',
    '..KjKjjKjjKjjKjK....',
    '...KjjjjjjjjjjjK....',
    '..KjjjjjjjjjjjjjK...',
    '...KjjjjjjjjjjjjK...',
    '....KKKKKKKKKKKK....',
    '....KtTTKsSKTTtK....',
    '....KTwTKSSKTwTK....',
    '....KhsSSSSSSshK....',
    '.....KsSSddSSsK.....',
    '.....KKssSSssKK.....',
  ],
  straw: [
    '....................',
    '.......KKKKKK.......',
    '......KyyyyyyK......',
    '.....KyTyyTyyTK.....',
    '..KKKKTTTTTTTTKKKK..',
    '.KyyyyyyyyyyyyyyyyK.',
    '..KKKKKKKKKKKKKKKK..',
    ...FACE,
  ],
  feather: [
    '............KwK.....',
    '...........KwwK.....',
    '......KKKKKKwK......',
    '.....KcCCCCCrK......',
    '....KcCCCCCCCrK.....',
    '...KKcccccccccKK....',
    '....KhhHHHHHHhhK....',
    ...FACE,
  ],
  miner: [
    '.........KyK........',
    '.......KKyyyKK......',
    '.....KKyyKKKyyKK....',
    '....KyyyKwwKyyyyK...',
    '....KyyyKwwKyyyyK...',
    '...KKKKKKKKKKKKKKK..',
    '....KhhHsSSsHhhK....',
    ...FACE,
  ],
  kidcap: [
    '....................',
    '....................',
    '....................',
    '.......KKKKKK.......',
    '......KcCCCCrK......',
    '.....KcCCCCCCCKK....',
    '.....KccccccccccK...',
    '.....KhhhhhhhhK.....',
    '.....KHsSeSeSsK.....',
    '.....KHsSeSeSsK.....',
    '......KsSdddsK......',
    '......KKsSSsKK......',
  ],
  long: [
    '....................',
    '.......KKKKKK.......',
    '.....KKhHHHHHhKK....',
    '....KhHHjjjjHHHhK...',
    '....KhHjjHHjjHHhK...',
    '....KhHHHHHHHHHhK...',
    '...KhHHHHHHHHHHhhK..',
    '...KhHsSSSSSSsHhhK..',
    '...KhHsSeSSeSsHhhK..',
    '...KhHsSeSSeSsHhhK..',
    '...KhHKsSddSsKHhK...',
    '...KhK.KKssKK.KhK...',
  ],
  // Will, the bald bard of Shakespeare in Sweatpants: a shiny dome, a fringe over the ears, a gold earring, a pointed beard
  poet: [
    '....................',
    '....................',
    '........KKKK........',
    '......KKSwSSKK......',
    '.....KsSwSSSSsK.....',
    '....KsSSSSSSSSsK....',
    '....KhsSSSSSSshK....',
    '....KHsSSSSSSsHK....',
    '....KHSeSSSSeSHK....',
    '....yhSeSSSSeShK....',
    '.....KsShhhhSsK.....',
    '......KKshhsKK......',
  ],
  // a red knit hat with a pompom and a ribbed band (Teenage Lewie's)
  beanie: [
    '.........KK.........',
    '........KwwK........',
    '.......KKKKKK.......',
    '.....KKcCCCCrKK.....',
    '....KcCCCCCCCCrK....',
    '....KcCcCcCcCcCK....',
    '....KhsSSSSSSshK....',
    ...FACE,
  ],
  // Mystery Robot Joe, night librarian of The Dog House: a tin box head, a bulb on his antenna,
  // reading glasses he does not need, a red bow tie
  tinbox: [
    '.........KyK........',
    '..........K.........',
    '.....KKKKKKKKKK.....',
    '.....KMMMMMMMMK.....',
    '.....KKKKMMKKKK.....',
    '.....KwewKKwewK.....',
    '.....KKKKMMKKKK.....',
    '.....KMMMMMMMMK.....',
    '.....KMmKKKKmMK.....',
    '.....KMMMMMMMMK.....',
    '.....KKKKKKKKKK.....',
    '.......KooKooK......',
  ],
  helmDark: [
    '....................',
    '......KKKKKKKK......',
    '....KKcCCCCCCcKK....',
    '...KcCCCCyyCCCCcK...',
    '...KcCCCyKKyCCCcK...',
    '...KcCCCKyyKCCCcK...',
    '...KcCCCyKKyCCCcK...',
    '...KcKKKKKKKKKKcK...',
    '...KcKooKKKKooKcK...',
    '...KcKKKKKKKKKKcK...',
    '....KcCCCCCCCCcK....',
    '.....KKcccccccK.....',
  ],
};

// ---------------------------------------------------------------- bodies (rows 12-16) and legs (17-19)
const BODIES: Record<string, string[]> = {
  tunic: ['....KgGLLLLLLGgK....', '...KsgGGLLLLGGgsK...', '...KsKgGGGGGGgKsK...', '....KKnNNyyNNnKK....', '.....KgGGGGGGgK.....'],
  dress: ['....KgGLLLLLLGgK....', '...KsgGGLLLLGGgsK...', '...KsKgGGGGGGgKsK...', '....KgGGGGGGGGgK....', '...KgGGGGGGGGGGgK...'],
  apron: ['....KgGwwwwwwGgK....', '...KsgGwwwwwwGgsK...', '...KsKgwwwwwwgKsK...', '....KKgwwwwwwgKK....', '.....KgwwwwwwgK.....'],
  robe: ['...KwgGLLLLLLGgwK...', '..KwsgGGLyyLGGgswK..', '..KwKgGGGyyGGGgKwK..', '...KwgGGGGGGGGgwK...', '...KwgGGGGGGGGgwK...'],
  tabard: ['....KmGLLLLLLGmK....', '...KsmGGLyyLGGmsK...', '...KsKmGGyyGGmKsK...', '....KKnNNNNNNnKK....', '.....KmGGGGGGmK.....'],
  coat: ['....KgGtLLLLtGgK....', '...KsgGGtLLtGGgsK...', '...KsKgGGtyGGgKsK...', '....KKgGGGGGGgKK....', '.....KgGGGGGGgK.....'],
  clown: ['....KgGpttyPGgK.....', '...KsgGGpTTPGgsK....', '...KsKgGGpTPGgKsK...', '....KKgGGGGGGgKK....', '.....KgGGGGGGgK.....'],
  // his starched white ruff over a velvet doublet with gold buttons
  doublet: ['...KwWwWwWwWwWwWK...', '...KggGGGyyGGGggK...', '...KgKgGGGGGGgKgK...', '...KsKgGGyyGGgKsK...', '....KKgGGGGGGgKK....'],
  // Joe's tin body with the tally counter in his chest
  tally: ['....KmMMMMMMMMmK....', '...KmKMMKwwKMMKmK...', '...KmKMMKeeKMMKmK...', '...KMKMMKKKKMMKMK...', '....KKmMMMMMMmKK....'],
  armor: ['...KcCMMMMMMMMCcK...', '..KcCcMMMooMMMcCcK..', '..KcKcMMMooMMMcKcK..', '...KKcCCCCCCCCcKK...', '...KcCCCCCCCCCCcK...'],
};
const LEGS: Record<string, string[]> = {
  boots: ['.....KpPPKKPPpK.....', '.....KnNNKKNNnK.....', '......KKK..KKK......'],
  skirt: ['....KgGGGGGGGGgK....', '.....KKnNKKNnKK.....', '......KKK..KKK......'],
  sneakers: ['.....KpPPKKPPpK.....', '....KooowKKooowK....', '....KKKKK..KKKKK....'],
  robe: ['...KwgGGGGGGGGgwK...', '...KwwwwwwwwwwwwK...', '....KKKKKKKKKKKK....'],
  short: ['......KpPKKPpK......', '......KnNKKNnK......', '.......KK..KK.......'],
  // grey sweatpants and fuzzy pink slippers
  slippers: ['.....KpPPKKPPpK.....', '....KfFFfKKfFFfK....', '....KKKKK..KKKKK....'],
  // Joe's tin feet
  robot: ['.....KmmKKKKmmK.....', '....KMMMMK.KMMMMK...', '....KKKKKK.KKKKKK...'],
  greaves: ['.....KmMMKKMMmK.....', '.....KcCCKKCCcK.....', '.....KKKK..KKKK.....'],
};

interface PersonSpec {
  head: keyof typeof HEADS;
  body: keyof typeof BODIES;
  legs: keyof typeof LEGS;
  key: Key;
  /** Extra pixels: [x, y, color] drawn last (a spear, a lute, a chicken). */
  extra?: [number, number, RGB][];
}

/** A person's two idle frames: standing, and blinking. */
export function person(p: PersonSpec): [Canvas, Canvas] {
  const rows = [...HEADS[p.head], ...BODIES[p.body], ...LEGS[p.legs]];
  const a = art(rows, p.key);
  const b = art(
    rows.map((r) => r.replace(/e/g, 'd')),
    p.key,
  );
  for (const [x, y, c] of p.extra ?? []) {
    a.set(x, y, c);
    b.set(x, y, c);
  }
  return [a, b];
}

// ---------------------------------------------------------------- the cast
const skinDark = { s: C('skin', 1), S: C('skin', 2), d: C('skin', 0) };

export const PEOPLE: Record<string, PersonSpec> = {
  grandma: { head: 'bun', body: 'dress', legs: 'skirt', key: lookKey({ hair: R('hairGrey', 0, 1, 1), coat: R('purple', 1, 2, 3), pants: R('leather', 1) }) },
  king: {
    head: 'crown',
    body: 'robe',
    legs: 'robe',
    key: lookKey(
      { hair: R('hairGrey', 0, 1, 1), coat: R('red', 1, 2, 3), pants: R('leather', 1), trim: R('gold', 1, 2, 3) },
      { w: C('white', 1), j: C('hairGrey', 1) },
    ),
  },
  guard: {
    head: 'helmet',
    body: 'tabard',
    legs: 'boots',
    key: lookKey({ hair: R('hairBrown', 0, 1), coat: R('blue', 1, 2, 3), pants: R('leather', 1, 2) }),
    extra: spear(),
  },
  kennel: {
    head: 'straw',
    body: 'tunic',
    legs: 'boots',
    key: lookKey({ hair: R('hairBlond', 0, 1), coat: R('orange', 0, 1, 2), pants: R('leather', 2, 3), trim: R('gold', 0, 1, 2) }),
  },
  librarian: {
    head: 'bun',
    body: 'dress',
    legs: 'skirt',
    key: lookKey({ hair: R('hairBrown', 0, 1, 2), coat: R('teal', 0, 1, 2), pants: R('leather', 0) }, { e: C('steel', 0) }),
  },
  smith: {
    head: 'bald',
    body: 'apron',
    legs: 'boots',
    key: lookKey({ hair: R('ink', 0, 0, 0), coat: R('leather', 0, 1, 2), pants: R('leather', 0, 1) }, { ...skinDark, w: C('leather', 2) }),
  },
  barkeep: { head: 'bald', body: 'apron', legs: 'boots', key: lookKey({ hair: R('red', 0, 1, 1), coat: R('green', 0, 1, 2), pants: R('leather', 1, 2) }) },
  harbor: {
    head: 'captain',
    body: 'coat',
    legs: 'boots',
    key: lookKey({ hair: R('hairGrey', 0, 1), coat: R('night', 0, 1, 1), pants: R('night', 0, 1), hat: R('night', 0, 1, 1), trim: R('gold', 1, 2, 3) }),
  },
  tinker: {
    head: 'goggles',
    body: 'coat',
    legs: 'boots',
    key: lookKey({ hair: R('white', 0, 1, 1), coat: R('leather', 1, 2, 3), pants: R('leather', 0, 1), trim: R('gold', 1, 2, 3) }),
  },
  fisher: {
    head: 'straw',
    body: 'tunic',
    legs: 'boots',
    key: lookKey(
      { hair: R('hairBrown', 0, 1), coat: R('gold', 1, 2, 3), pants: R('blue', 0, 1), trim: R('gold', 1, 2, 3) },
      { y: C('gold', 2), T: C('gold', 1) },
    ),
  },
  minstrel: {
    head: 'feather',
    body: 'tunic',
    legs: 'boots',
    key: lookKey({ hair: R('hairBlond', 0, 1), coat: R('purple', 1, 2, 3), pants: R('red', 1, 2), hat: R('green', 1, 2, 3) }),
    extra: lute(),
  },
  foreman: {
    head: 'miner',
    body: 'tunic',
    legs: 'boots',
    key: lookKey({ hair: R('hairBrown', 0, 1), coat: R('red', 0, 1, 2), pants: R('blue', 0, 1), trim: R('gold', 1, 2, 3) }),
  },
  hermit: {
    head: 'hood',
    body: 'robe',
    legs: 'robe',
    key: lookKey(
      { hair: R('hairGrey', 0, 1, 1), coat: R('leather', 0, 1, 2), pants: R('leather', 0), hat: R('leather', 0, 1, 2) },
      { w: C('leather', 1), j: C('white', 1) },
    ),
  },
  shopkeep: { head: 'long', body: 'apron', legs: 'skirt', key: lookKey({ hair: R('red', 0, 1, 2), coat: R('blue', 1, 2, 3), pants: R('leather', 1) }) },
  farmer: {
    head: 'straw',
    body: 'tunic',
    legs: 'boots',
    key: lookKey({ hair: R('hairBrown', 0, 1), coat: R('blue', 1, 2, 3), pants: R('leather', 1, 2), trim: R('gold', 1, 2, 3) }),
  },
  kid: {
    head: 'kidcap',
    body: 'tunic',
    legs: 'short',
    key: lookKey({ hair: R('hairBlond', 0, 1), coat: R('red', 1, 2, 3), pants: R('blue', 1, 2), hat: R('blue', 1, 2, 3) }),
  },
  // Doc Leo: chewed-up grey felt fedora with pins, painted stubble, white paint round his eyes
  // and his mouth, his own nose sunburned pink, navy corduroy over a purple shirt and green tie,
  // and red sneakers
  docleo: {
    head: 'fedora',
    body: 'clown',
    legs: 'sneakers',
    extra: leash(),
    key: lookKey(
      {
        hair: [C('steel', 0), C('steel', 1), C('steel', 1)],
        coat: R('night', 0, 1, 1),
        pants: R('night', 0, 1),
        hat: R('steel', 0, 1, 2),
        trim: R('green', 1, 2, 3),
      },
      { w: C('white', 1), o: C('red', 2), q: C('pink', 2), p: C('purple', 2), P: C('purple', 1), t: C('green', 2), T: C('green', 3), y: C('gold', 2) },
    ),
  },
  // Will the playwright, visiting from Shakespeare in Sweatpants: dressed for the stage from the
  // waist up and for the couch from the waist down
  poet: {
    head: 'poet',
    body: 'doublet',
    legs: 'slippers',
    key: lookKey(
      { hair: R('hairBrown', 0, 1, 1), coat: R('purple', 1, 2, 3), pants: R('steel', 1, 2), trim: R('gold', 1, 2, 3) },
      { f: C('pink', 1), F: C('pink', 2) },
    ),
  },
  // Teenage Lewie (Snowbound): a red knit hat, a red coat and a snow shovel, here helping
  // Farmer Hodge with the turnips
  lewie: {
    head: 'beanie',
    body: 'coat',
    legs: 'boots',
    key: lookKey({ hair: R('hairBrown', 0, 1), coat: R('red', 1, 2, 3), pants: R('blue', 0, 1), hat: R('red', 1, 2, 3), trim: R('red', 0, 1, 2) }),
    extra: shovel(),
  },
  // Mystery Robot Joe (Keep It Brief!), visiting the Royal Library after hours
  joe: {
    head: 'tinbox',
    body: 'tally',
    legs: 'robot',
    key: lookKey({ hair: R('steel', 0, 1), coat: R('steel', 1, 2, 3), pants: R('steel', 1, 2), trim: R('gold', 1, 2, 3) }, { d: C('white', 0), e: C('ink') }),
  },
  deadline: {
    head: 'helmDark',
    body: 'armor',
    legs: 'greaves',
    key: lookKey(
      { hair: R('ink', 0), coat: R('night', 0, 1), pants: R('night', 0, 1), hat: R('night', 0, 1, 1), trim: R('gold', 1, 2, 3) },
      { M: C('steel', 1), m: C('steel', 0), o: C('red', 2), y: C('gold', 2) },
    ),
  },
};

function spear(): [number, number, RGB][] {
  const out: [number, number, RGB][] = [];
  for (let y = 3; y < 19; y++) out.push([17, y, C('leather', 1)]);
  out.push([17, 1, C('steel', 3)], [17, 2, C('steel', 2)], [16, 2, C('steel', 1)], [18, 2, C('steel', 1)]);
  return out;
}

/** The leash from Doc Leo's hand down to Sir Reginald Cluckington III at his feet. */
function leash(): [number, number, RGB][] {
  const out: [number, number, RGB][] = [];
  for (const [x, y] of [
    [3, 15],
    [2, 16],
  ])
    out.push([x, y, C('red', 2)]);
  for (const [x, y] of [
    [0, 17],
    [1, 17],
    [0, 18],
    [1, 18],
    [2, 18],
  ])
    out.push([x, y, C('gold', 2)]);
  out.push([1, 16, C('gold', 3)], [2, 17, C('red', 2)], [0, 16, C('orange', 1)]);
  return out;
}

/** Lewie's snow shovel, held at his side: a wooden handle and a steel blade. */
function shovel(): [number, number, RGB][] {
  const out: [number, number, RGB][] = [];
  for (let y = 10; y < 17; y++) out.push([17, y, C('leather', 2)]);
  out.push([16, 10, C('leather', 1)], [18, 10, C('leather', 1)]);
  for (let x = 15; x <= 19; x++) out.push([x, 17, C('steel', 2)], [x, 18, C('steel', 3)]);
  out.push([15, 19, C('outline')], [19, 19, C('outline')]);
  return out;
}

function lute(): [number, number, RGB][] {
  const out: [number, number, RGB][] = [];
  for (const [x, y] of [
    [6, 14],
    [7, 14],
    [6, 15],
    [7, 15],
    [8, 15],
    [7, 16],
  ])
    out.push([x, y, C('orange', 1)]);
  for (let k = 0; k < 5; k++) out.push([9 + k, 13 - k, C('leather', 0)]);
  return out;
}

void baseKey;

// ---------------------------------------------------------------- animals

const CORGI: Key = baseKey({
  k: C('ink'),
  O: C('corgi', 2),
  o: C('corgi', 1),
  L: C('corgi', 3),
  w: C('white', 1),
  W: C('white', 0),
  p: C('pink', 1),
  t: C('red', 2),
});
const LAB: Key = baseKey({
  k: C('ink'),
  O: C('choc', 1),
  o: C('choc', 0),
  L: C('choc', 2),
  w: C('white', 1),
  W: C('white', 0),
  p: C('pink', 1),
  t: C('pink', 1),
  y: C('gold', 2),
});

/** Teddy sitting, facing you: huge upright ears, a matched pair, white blaze, grin. */
const TEDDY_SIT = [
  '....................',
  '....................',
  '...KK.........KK....',
  '...KOK.......KOK....',
  '...KOpK.....KpOK....',
  '...KOpOKKKKKOpOK....',
  '...KOOOOOwwOOOOK....',
  '...KOOkOOwwOOkOK....',
  '...KOOOOwwwwOOOK....',
  '....KOOwwKKwwOK.....',
  '.....KOwKttKwOK.....',
  '.....KOOwwwwOOK.....',
  '....KOOwwwwwwOOK....',
  '....KOOwwwwwwOOK....',
  '...KOOOwwwwwwOOOK...',
  '...KOOOOwwwwOOOOK...',
  '...KOOwwKOOKwwOOK...',
  '...KwwwwKKKKwwwwK...',
  '....KKKK....KKKK....',
  '....................',
];

/** Gwinn sitting: lean, short chocolate coat, floppy ears, amber eyes, a pink collar. */
const GWINN_SIT = [
  '....................',
  '....................',
  '.......KKKKKK.......',
  '.....KKOOOOOOKK.....',
  '....KoKOOOOOOKoK....',
  '...KooKOyOOyOKooK...',
  '...KooKOkOOkOKooK...',
  '...KoK.KOLLOK.KoK...',
  '....K..KOLLOK..K....',
  '.......KOkkOK.......',
  '.......KtpptK.......',
  '......KOOwwOOK......',
  '......KOOOOOOK......',
  '.....KOOOOOOOOK.....',
  '.....KOOOOOOOOK.....',
  '.....KOOKOOKOOK.....',
  '.....KLLKOOKLLK.....',
  '.....KKKKKKKKKK.....',
  '....................',
  '....................',
];

/** Sir Reginald Cluckington III: a yellow rubber chicken in a red harness, leash trailing. */
const CHICKEN = [
  '....................',
  '....................',
  '.........KK.........',
  '........KttK........',
  '.......KyyyyK.......',
  '.......KykyyKK......',
  '......KKyyyyooK.....',
  '......KyyyyyKK......',
  '.....KyyyyyyK.......',
  '....KyyttttyyK......',
  '...KyyyyyyyyyyK.....',
  '...KyYyyyyyyyyK.....',
  '....KYyyyyyyyK......',
  '.....KKyyyyKK.......',
  '.......KooK.........',
  '......KooKoK........',
  '..tttt..............',
  '.t..................',
  '....................',
  '....................',
];
const CHICK_KEY: Key = baseKey({ y: C('gold', 2), Y: C('gold', 3), t: C('red', 2), o: C('orange', 1), k: C('ink') });

export function animalPics(): Map<string, Canvas> {
  const m = new Map<string, Canvas>();
  const blink = (rows: string[], key: Key, name: string) => {
    m.set(`${name}0`, art(rows, key));
    m.set(
      `${name}1`,
      art(
        rows.map((r, i) => (i < 9 ? r.replace(/k/g, i < 9 ? 'O' : 'k') : r)),
        key,
      ),
    );
  };
  blink(TEDDY_SIT, CORGI, 'teddy');
  blink(GWINN_SIT, LAB, 'gwinn');
  m.set('chick0', art(CHICKEN, CHICK_KEY));
  m.set('chick1', art(CHICKEN, CHICK_KEY, 20, 20, 0, -1));
  return m;
}

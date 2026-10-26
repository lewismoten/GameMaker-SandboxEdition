// Pip, the stable hand of Nowish and the only person in Procrastia who does things right away:
// a red squire's cap with a white feather, a green tunic, a brass buckle. One block tall, drawn
// facing down, up and to the right (left is the right view mirrored by the character file).
import { art, lookKey, R, type Key } from '../art/sprite';
import { C } from '../art/pal';
import type { Canvas } from '../art/rgb';

const PIP_KEY: Key = lookKey({
  hair: R('hairBrown', 0, 1, 2),
  coat: R('green', 1, 2, 3),
  pants: R('leather', 2, 3),
  hat: R('red', 1, 2, 3),
});

const FRONT_TOP = [
  '....................',
  '........KKKK........',
  '......KKCCCCKK......',
  '.....KCCrrCCCCK.....',
  '.....KCrCCCCCCKwK...',
  '....KccccccccccKwK..',
  '....KhhhhhhhhhhKK...',
  '....KhHsSSSSsHhK....',
  '....KHsSeSSeSsHK....',
  '....KHsSeSSeSsHK....',
  '.....KsSSddSSsK.....',
  '.....KKssSSssKK.....',
];
const FRONT_BODY = ['....KgGLLLLLLGgK....', '...KsgGGLLLLGGgsK...', '...KsKgGGGGGGgKsK...', '....KKnNNyyNNnKK....', '.....KgGGGGGGgK.....'];
const FRONT_LEGS = {
  stand: ['.....KpPPKKPPpK.....', '.....KnNNKKNNnK.....', '......KKK..KKK......'],
  a: ['.....KpPPKKnNnK.....', '.....KnNNK.KKK......', '......KKK...........'],
  b: ['.....KnNnKKPPpK.....', '......KKK.KNNnK.....', '...........KKK......'],
};

const BACK_TOP = [
  '....................',
  '........KKKK........',
  '......KKCCCCKK......',
  '.....KCCCCCCCCK.....',
  '...KwKCCCCCCrCK.....',
  '..KwKccccccccccK....',
  '...KKhhhhhhhhhhK....',
  '....KhHHHHHHHHhK....',
  '....KhHHjjjHHHhK....',
  '....KhhHHHHHHhhK....',
  '.....KhhhhhhhhK.....',
  '.....KKsddddsKK.....',
];
const BACK_BODY = ['....KgGGGGGGGGgK....', '...KsgGGGGGGGGgsK...', '...KsKgGGGGGGgKsK...', '....KKnNNNNNNnKK....', '.....KgGGGGGGgK.....'];

const SIDE_TOP = [
  '....................',
  '.......KKKKK........',
  '.....KKCCCCrKK......',
  '..KwKKCCCCCCrCK.....',
  '.KwwKcCCCCCCCCCK....',
  '..KKKcccccccccccK...',
  '....KhhhhhhsSSKK....',
  '....KhHHHhsSSeSK....',
  '....KhHHHsSSSeSK....',
  '....KhhHHsSSSSSSK...',
  '.....KhhhsSSSddK....',
  '......KKKssssKK.....',
];
const SIDE_BODY = ['.....KgGGLLLGK......', '.....KgGGLLsSK......', '.....KgGGGGsSK......', '.....KnNNyNNK.......', '.....KgGGGGGK.......'];
const SIDE_LEGS = {
  stand: ['......KpPKPpK.......', '......KnNKNnNK......', '.......KK.KKK.......'],
  a: ['.....KpPK.KPpK......', '....KnNK...KnNK.....', '.....KK.....KK......'],
  b: ['......KpPKPpK.......', '......KnNKnNK.......', '.......KKKKK........'],
};

const BLINK = ['....KHsSKKSKKsHK....', '....KHsSSSSSSsHK....'];

function pose(top: string[], body: string[], legs: string[], key = PIP_KEY): Canvas {
  return art([...top, ...body, ...legs], key);
}

/** Every picture of Pip, by name. */
export function heroPics(): Map<string, Canvas> {
  const m = new Map<string, Canvas>();
  m.set('down0', pose(FRONT_TOP, FRONT_BODY, FRONT_LEGS.stand));
  m.set('down1', pose(FRONT_TOP, FRONT_BODY, FRONT_LEGS.a));
  m.set('down2', pose(FRONT_TOP, FRONT_BODY, FRONT_LEGS.b));
  m.set('blink', pose([...FRONT_TOP.slice(0, 8), ...BLINK], FRONT_BODY, FRONT_LEGS.stand));
  m.set('up0', pose(BACK_TOP, BACK_BODY, FRONT_LEGS.stand));
  m.set('up1', pose(BACK_TOP, BACK_BODY, FRONT_LEGS.a));
  m.set('up2', pose(BACK_TOP, BACK_BODY, FRONT_LEGS.b));
  m.set('side0', pose(SIDE_TOP, SIDE_BODY, SIDE_LEGS.stand));
  m.set('side1', pose(SIDE_TOP, SIDE_BODY, SIDE_LEGS.a));
  m.set('side2', pose(SIDE_TOP, SIDE_BODY, SIDE_LEGS.b));
  // the swing: sword up, then across
  const windup = pose(FRONT_TOP, FRONT_BODY, FRONT_LEGS.stand);
  for (let y = 0; y < 9; y++) windup.set(16, 3 + y, y < 2 ? C('steel', 3) : C('steel', 2));
  windup.set(15, 12, C('gold', 2)).set(16, 12, C('gold', 2)).set(17, 12, C('gold', 2));
  windup.set(16, 13, C('leather', 1));
  m.set('windup', windup);
  const strike = pose(FRONT_TOP, FRONT_BODY, FRONT_LEGS.stand);
  for (let k = 0; k < 7; k++) {
    strike.set(13 + k, 14 + Math.floor(k / 2), k > 4 ? C('steel', 3) : C('steel', 2));
    strike.set(13 + k, 13 + Math.floor(k / 2), C('steel', 3));
  }
  strike.set(12, 14, C('gold', 2)).set(12, 13, C('gold', 2));
  m.set('strike', strike);
  // hurt: flushed red, eyes squeezed shut
  const ouch = lookKey(
    { hair: R('hairBrown', 0, 1, 2), coat: R('green', 1, 2, 3), pants: R('leather', 2, 3), hat: R('red', 1, 2, 3) },
    { s: C('red', 3), S: C('pink', 2), d: C('red', 2) },
  );
  m.set('hurt', pose([...FRONT_TOP.slice(0, 8), ...BLINK], FRONT_BODY, FRONT_LEGS.a, ouch));
  // lying flat (the character file turns it on its side)
  m.set('down', pose([...FRONT_TOP.slice(0, 8), ...BLINK], FRONT_BODY, FRONT_LEGS.stand));
  // stooping for something at his feet
  m.set(
    'stoop',
    pose(['....................', ...FRONT_TOP.slice(0, 11)], FRONT_BODY, ['.....KnNNKKNNnK.....', '......KKK..KKK......', '....................']),
  );
  // a toot on the kazoo and a swig of tonic
  const toot = pose(FRONT_TOP, FRONT_BODY, FRONT_LEGS.stand);
  for (let k = 0; k < 5; k++) toot.set(11 + k, 10, C('gold', k % 2 ? 2 : 3));
  toot.set(16, 9, C('gold', 3)).set(16, 11, C('gold', 3));
  m.set('toot', toot);
  const swig = pose(FRONT_TOP, FRONT_BODY, FRONT_LEGS.stand);
  swig.rect(12, 6, 3, 5, C('teal', 2));
  swig.rect(12.5, 4.5, 2, 1.5, C('leather', 2));
  m.set('swig', swig);
  return m;
}

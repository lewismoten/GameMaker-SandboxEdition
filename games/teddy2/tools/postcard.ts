// The Corn Maze postcard and grille (kind postcardgrille in printables.json): writes the item. The message is a
// souvenir card from the Fair, mostly ordinary news; laid under the grille, the one placement whose two marks meet
// their pictures reads BALE, BALE, HOLE, HOLE: the maze's real way (hay bale step up at the first and second
// tiers, holes down at the third and second). Re-run after changing the text; the test
// (web/src/manual/printables/postcardGrille.test.ts) checks every placement of what is written.
//   npx vite-node ../games/teddy2/tools/postcard.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPostcard, type Clause } from '../../kit/postcardGrille';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..');

const slot = (...lines: string[]): Clause[] => lines.map((l) => ({ t: l.split(' ') as Clause['t'] }));
const clauses: Clause[] = [
  ...slot(
    '{} was fun.',
    '{} next, please.',
    '{} all over.',
    '{} smelled good.',
    '{} again, huh?',
    '{} was huge!',
    '{} is waiting.',
    '{} was closed.',
    '{} was there.',
    '{} looked tasty.',
    '{} fooled Teddy.',
    '{} costs nothing.',
  ),
  ...slot(
    'Saw {} today.',
    'No {} here.',
    'More {} soon.',
    'Big {} ahead!',
    'Found {} twice.',
    'Try {} first.',
    'One {} left.',
    'Same {} again.',
    'Every {} counts.',
    'Two {} later.',
    'Each {} helps.',
    'That {} again!',
  ),
  ...slot(
    'Saw the {}.',
    'Near the {}.',
    'By the {}.',
    'Under the {}.',
    'Past the {}.',
    'Left the {}.',
    'Ask the {}.',
    'Over the {}.',
    'Beyond the {}.',
    'Behind the {}.',
    'Loved the {}.',
    'Missed the {}.',
  ),
  ...slot('{} or {}?', '{} and {}.'),
  ...slot(
    'Weather is perfect.',
    'Corn dogs, twice!',
    'Prizes are good.',
    'Lines were short.',
    'Teddy loves it.',
    'Pie was great.',
    'Music all day.',
    'Crowds are big.',
    'Clowns were kind.',
    'Ferris wheel rocks!',
    'Sun all day.',
    'Bring a sweater.',
    'Home by supper.',
    'Back soon, promise.',
    'Dogs are welcome.',
    'Rides cost tickets.',
    'Ice cream, twice!',
    'Lights are pretty.',
    'Missed you lots.',
    'Hot, but nice.',
    'Write me back.',
    'Feet are sore.',
    'Gwinn says hi.',
    'Popcorn for lunch.',
  ),
];

const GRILLE = {
  n: 3,
  holes: [
    [0, 0],
    [1, 2],
    [2, 1],
    [0, 2],
  ] as [number, number][],
  a: { name: 'stick', row: 2 },
  b: { name: 'paw', col: 0 },
};
const built = buildPostcard({
  rows: 5,
  cols: 9,
  grille: GRILLE,
  symbols: ['stick', 'bone', 'paw', 'mouse', 'crow', 'corn'],
  answer: ['bale', 'bale', 'hole', 'hole'],
  decoys: [
    ['bale', 'hole', 'bale', 'hole'],
    ['pie', 'bale', 'bell', 'hole'],
    ['hole', 'corn', 'bale', 'sign'],
    ['goose', 'hole', 'bale', 'fence'],
    ['bale', 'crow', 'hole', 'bell'],
    ['hole', 'hole', 'mouse', 'bale'],
  ],
  nouns: ['corn', 'pie', 'goose', 'bell', 'fence', 'sign', 'crow', 'mouse', 'stick', 'bone', 'ribbon', 'ticket', 'tent', 'cart'],
  clauses,
  matches: [3, 5],
});

const G = (rows: string[]) => rows;
const glyphs: Record<string, string[]> = {
  stick: G(['...###...', '..#####..', '..#####..', '..#####..', '..#####..', '...###...', '....#....', '....#....', '....#....']),
  bone: G(['.........', '##.....##', '###...###', '.#######.', '.#######.', '###...###', '##.....##', '.........', '.........']),
  paw: G(['.##...##.', '.##...##.', '...###...', '#..###..#', '#..###..#', '..#####..', '..#####..', '...###...', '.........']),
  mouse: G(['.##...##.', '.##...##.', '..#####..', '.#.###.#.', '.#######.', '..#####..', '...#.#...', '..#...#..', '.........']),
  crow: G(['...##....', '..####...', '.#.####..', '.#######.', '..#######', '...#####.', '....###..', '....#.#..', '...##.##.']),
  corn: G(['...##....', '..####...', '.#.##.#..', '.######..', '.#.##.#..', '.######..', '..####...', '.#.##.#..', '..#..#...']),
};

const item = {
  kind: 'postcardgrille',
  title: 'The Corn Maze Postcard and Grille',
  note: 'Lay the card over the postcard to read the way through',
  heading: 'GREETINGS FROM THE TRI-COUNTY FAIR',
  caption: 'The Corn Maze',
  address: ['To: Doc Leo', 'P.O. Box 000'],
  rows: built.words,
  border: built.border,
  grille: GRILLE,
  glyphs,
  howto: [
    'The postcard is written in a hurry, and almost all of it is plain news. Cut out the grille card (glue its two faces back to back) and cut its four numbered holes.',
    'The grille has two pictures on its edges: a corn dog stick and a paw print. Slide, turn and flip the card until each picture looks straight out along its row or column, to the same picture printed on the postcard.',
    'Read the holes in number order. BALE means hop up a hay bale step; HOLE means drop down a hole. Most places read nonsense, and a few read a wrong way through the maze.',
  ],
  puzzles: [
    {
      scenes: [7],
      ask: 'The Corn Maze: three tiers of paths between the corn, and some paths only end. Which way up and down is the real way through?',
      place: built.answer,
      answer: 'Bale, bale, hole, hole: up two hay bale steps, then down two holes.',
    },
  ],
};

// spliced into the file's own text, so the rest of printables.json keeps its order and spacing
const file = join(dir, 'printables.json');
let text = readFileSync(file, 'utf8');
const at = text.indexOf(',\n  {\n   "kind": "postcardgrille"');
if (at >= 0) text = text.slice(0, at) + text.slice(text.lastIndexOf('\n ]\n}'));
const body = JSON.stringify(item, null, 1)
  .split('\n')
  .map((l) => '  ' + l)
  .join('\n');
const end = text.lastIndexOf('\n ]\n}');
writeFileSync(file, `${text.slice(0, end)},\n${body}${text.slice(end)}`);
console.log(`seed ${built.seed}: ${built.matching.length} matching placements`);
for (const m of built.matching) console.log(JSON.stringify(m.place), m.reads.join(' '));
for (const r of built.words) console.log(r.join(' '));

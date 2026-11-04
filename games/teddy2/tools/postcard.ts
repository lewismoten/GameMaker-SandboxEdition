// The Corn Maze postcard and grille (kind postcardgrille in printables.json): writes the item. The message is a
// souvenir card from the Fair, mostly ordinary news; laid under the grille, the one placement whose two marks meet
// their pictures reads BALE, BALE, HOLE, HOLE: the maze's real way (hay bale step up at the first and second
// tiers, holes down at the third and second). Re-run after changing the text; the test
// (web/src/manual/printables/postcardGrille.test.ts) checks every placement of what is written.
//   npx vite-node ../games/teddy2/tools/postcard.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPostcard } from '../../kit/postcardGrille';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..');

// Gwinn's card to Teddy. One word fills a cell (five letters or fewer), longer words spill over the next; "/" ends a
// line. Bale and hole turn up all through it, in ordinary sentences, so the answer's two of each do not stand out.
const TEXT = `
Dear Teddy, Greetings from the Fair! The corn maze was /
a hoot. Every hay bale is a step up, and every hole /
is a drop, so mind your paws. The scarecrow in the /
middle of the maze left me a corn dog stick, /
licked clean. I ate the pie, not the bale. /
Twirly says a bale or hole is easy to tell, but /
I got lost twice near the bale steps and the crow. /
Please mind the last hole near the scarecrow. /
The wind rolled a bale past me! Hold your ears. /
Doc Leo parked THE~CHEZ by the corn and waits. /
For you, a bone! Wish you were here. /
| | | | | | Love, Gwinn
`;

const GRILLE = {
  n: 3,
  holes: [
    [0, 0],
    [1, 2],
    [2, 1],
    [0, 2],
  ] as [number, number][],
  a: { name: 'corndog', row: 2 },
  b: { name: 'paw', col: 0 },
};
const built = buildPostcard({
  rows: 12,
  cols: 12,
  grille: GRILLE,
  symbols: ['corndog', 'bone', 'paw', 'crow', 'corn', 'ribbon', 'bell', 'tent', 'star', 'sun'],
  answer: ['bale', 'bale', 'hole', 'hole'],
  plausible: [
    'bale',
    'hole',
    'corn',
    'pie',
    'bell',
    'crow',
    'hay',
    'stick',
    'bone',
    'maze',
    'step',
    'steps',
    'drop',
    'wind',
    'ears',
    'paws',
    'dog',
    'scarecrow',
    'wild',
    'lost',
  ],
  decoys: 2,
  text: TEXT,
  matches: [3, 7],
});

const G = (rows: string[]) => rows;
const glyphs: Record<string, string[]> = {
  corndog: G(['...###...', '..#####..', '..#.#.#..', '..#####..', '..#.#.#..', '..#####..', '...###...', '....#....', '....#....']),
  bone: G(['.........', '##.....##', '###...###', '.#######.', '.#######.', '###...###', '##.....##', '.........', '.........']),
  paw: G([
    '....#...#....',
    '...###.###...',
    '....#...#....',
    '.#.........#.',
    '###.......###',
    '.#.........#.',
    '.............',
    '.....###.....',
    '...#######...',
    '..#########..',
    '..#########..',
    '...#######...',
  ]),
  sun: G(['....#....', '.#..#..#.', '..#####..', '#.#####.#', '..#####..', '.#..#..#.', '....#....']),
  crow: G(['..##.....', '.####....', '##.##....', '.#####...', '..######.', '..#######', '...#####.', '....#.#..', '....#.#..']),
  corn: G(['...###...', '..#####..', '..#.#.#..', '..#####..', '..#.#.#..', '#.#####.#', '##.###.##', '.#######.', '...###...', '....#....']),
  ribbon: G(['..#.#.#..', '.#######.', '###...###', '##.....##', '###...###', '.#######.', '..#####..', '..#...#..', '.##...##.']),
  bell: G(['...###...', '..#####..', '..#####..', '..#####..', '.#######.', '#########', '.........', '...###...']),
  tent: G(['....#....', '...###...', '..#####..', '.#######.', '#########', '###...###', '###...###', '###...###']),
  star: G(['....#....', '....#....', '...###...', '#########', '.#######.', '..#####..', '..##.##..', '.##...##.', '.#.....#.']),
};

const item = {
  kind: 'postcardgrille',
  title: 'The Corn Maze Postcard and Grille',
  note: 'Lay the card over the postcard to read the way through',
  heading: 'GREETINGS FROM THE TRI-COUNTY FAIR',
  address: ['Teddy', 'P.O. Box 000', 'Anytown, ST 00000'],
  caption: 'The Corn Maze',
  rows: built.words,
  border: built.border,
  grille: GRILLE,
  glyphs,
  howto: [
    "Gwinn's postcard is full of plain news about the Fair. Cut out the grille card (glue its two faces back to back) and cut its four numbered holes.",
    'The grille has two pictures on its edges: a corn dog and a paw print. Slide, turn and flip the card until each picture looks straight out along its row or column, to the same picture printed on the postcard.',
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
for (const r of built.words) console.log(r.map((w) => w.padEnd(6)).join('|'));

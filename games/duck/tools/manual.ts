// Writes games/duck/manual.json: the pages of the game's manual. The "How this level is made" pages show Kit's stand and his
// two duck frames enlarged, and a bird flying through the row of his head against each, with the pixels that would touch
// marked in red (computed the way PLAYGAME compares pictures: a pixel touches only if both have a color there).
//   cd web && npx vite-node ../games/duck/tools/manual.ts && npx prettier --write ../games/duck/manual.json
import { writeFileSync } from 'node:fs';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { framesFigure } from '../../kit/starter/framesSvg';
import { heroPicture } from '../../kit/starter/hero';
import { buildHeroBlocks2 } from '../src/hero';
import { buildMonsterBlocks } from '../src/monsters';
import { buildLevels } from '../src/levels';

const { pal } = buildLevels();
const hero = buildHeroBlocks2(pal);
const mon = buildMonsterBlocks(pal);
const T = 255;
const red = pal.c('hot', 0);
const guide = pal.c('sky', 1);

/** Kit's two blocks, 20x40. The empty top block of a duck is drawn as a dotted frame, so it can be seen to be empty. */
function stack(top: Pixels | undefined, bottom: Pixels, dots = false): Pixels {
  const p = new Pixels(20, 40, T);
  if (top) p.px.set(top.px, 0);
  else if (dots) for (let i = 0; i < 20; i += 2) p.set(i, 0, guide).set(i, 19, guide).set(0, i, guide).set(19, i, guide);
  p.px.set(bottom.px, 400);
  return p;
}
const stand = heroPicture(hero, 'stand.top', 'stand');
const duck0 = stack(undefined, hero.pics.get('duck0')!, true);
const duck1 = stack(undefined, hero.pics.get('duck1')!);

/** `kit` with a flier drawn over it in block row `row` (0 head, 1 feet): the pixels where both have a color are red. */
function touching(kit: Pixels, flier: Pixels, row: 0 | 1): { pic: Pixels; n: number } {
  const p = new Pixels(20, 40, T);
  p.px.set(kit.px);
  let n = 0;
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const f = flier.get(x, y);
      if (f === T) continue;
      const at = y + row * 20;
      if (kit.get(x, at) !== T) {
        p.set(x, at, red);
        n++;
      } else p.set(x, at, f);
    }
  return { pic: p, n };
}
const bird = mon.pics.get('bird1')!;
const ball = mon.pics.get('ball0')!;
const birdStand = touching(stand, bird, 0);
const birdDuck = touching(duck1, bird, 0);
const ballDuck = touching(duck1, ball, 1);
const ballStand = touching(stand, ball, 1);

const figures = {
  frames: framesFigure(
    pal,
    [
      { pic: stand, label: 'stand: a head picture over a body picture' },
      { pic: duck0, label: 'duck0: no head picture (dotted), the crouch below' },
      { pic: duck1, label: 'duck1: the same, a pixel lower' },
    ],
    4,
  ),
  touch: framesFigure(
    pal,
    [
      { pic: birdStand.pic, label: `standing: ${birdStand.n} pixels touch the bird (red)` },
      { pic: birdDuck.pic, label: `ducking: ${birdDuck.n} pixels touch it` },
    ],
    4,
  ),
  ball: framesFigure(
    pal,
    [
      { pic: ballDuck.pic, label: `ducking under a ball: ${ballDuck.n} pixels touch it (red)` },
      { pic: ballStand.pic, label: `standing: ${ballStand.n} touch, so a hop is how to miss it` },
    ],
    4,
  ),
};
const fig = (name: keyof typeof figures) => figures[name].replace('data-frames="NAME"', `data-frames="${name}"`);

const kbd = (s: string) => `<kbd>${s}</kbd>`;
const pages = [
  {
    head: 'Welcome',
    html: `<h1>Welcome</h1><p><b>Kit Ducks</b> is a Starter: a small game that shows a few Game-Maker ideas, with signs in the levels that say what you are looking at. It has two short levels and takes a few minutes to finish.</p><p>Kit is two blocks tall, a head block over a body block. Friendly bluebirds fly back and forth at the height of their head. Hold ${kbd('Down')} and they duck, and a bird flies over them without touching. The trick is in Kit's picture and not in the bird.</p><p>Play it first. Then open it in Game-Maker (<b>Edit a copy</b> on the home page keeps the original safe) and read the pages below, which say where each thing in the levels is made.</p><h2>The keys</h2><p>${kbd('Left')} and ${kbd('Right')} walk. ${kbd('Space')} hops. ${kbd('Down')} ducks for as long as it is held. ${kbd('F2')} shows your lives, hit points and score. Walk into the door at the end of a level to go on.</p><p>A bird or a ball that touches Kit costs a few hit points. It never costs a life if you are careful.</p>`,
  },
  {
    head: 'Level 1: Head Height',
    html: `<h1>Level 1: Head Height</h1><p><b>A BIRD FLIES AT HEAD HEIGHT. HOLD DOWN AND KIT DUCKS UNDER IT</b> is the first sign. The second says <b>THE ROOF IS TOO LOW TO HOP OVER. DUCK AS EACH BIRD PASSES</b>: under the striped awning a hop rises less than a block, and a bird fills the whole row. Three bluebirds patrol under it. Walk to the first one and, as it comes, hold ${kbd('Down')}. Kit crouches and the bird flies over. Let go once it has passed, and walk on. Try walking straight into it once, to see what it costs.</p>`,
  },
  {
    head: 'How this level is made',
    html: `<h1>How level 1 is made</h1><ul><li><b>The duck is a sequence.</b> Open <b>hero.chr</b> in the Character tab and look at the sequence on the Down key. It has two frames. Each frame picks two pictures from <b>hero.cbl</b>, a top one and a bottom one. In these frames the top picture is set to <b>none</b>, and the bottom is the crouch (<b>duck0</b>, then <b>duck1</b>, a pixel lower).${fig('frames')}</li><li><b>Why the bird misses.</b> PLAYGAME decides whether a monster touches Kit by laying its picture over each of Kit's pictures, pixel by pixel. A pixel touches only if both have a color in it. With no top picture there is nothing in the row of their head, so the bird has nothing to touch. The red pixels below are the ones that would.${fig('touch')}The bird itself is the same each time. Only Kit's frame changed.</li><li><b>Held, and let go.</b> <b>One sequence per key stroke</b> is off for the duck, so while Down is held the two frames start again and again. Let go, and Kit goes back to standing.</li><li><b>The bird.</b> Open <b>dk.mon</b> in the Monsters tab: the bluebird has two pictures (wings up, wings down) and a path that goes nine blocks to the right and then back. Its block in <b>dk.mbl</b> takes a hit point for each tick it touches Kit, and is not solid, so it never pushes them. A bird is placed on the map in the row of Kit's head. Open <b>one.map</b>: their head is in the row two above the ground.</li><li><b>The awning.</b> A solid block, one block above Kit's head. A hop under it rises less than a block, which is not enough to clear a bird, so ducking is the way. The posts are not solid.</li><li><b>The signs and the exit.</b> The signs are ordinary blocks with words in their pictures. A scene link joins the door at the right to the next level in <b>dk.gam</b>.</li></ul>`,
  },
  {
    head: 'Level 2: High or Low',
    html: `<h1>Level 2: High or Low</h1><p><b>HIGH BIRD, SO DUCK. LOW BALL, SO HOP WITH SPACE</b> is the first sign. A bird at head height is for ${kbd('Down')}. Then <b>A DUCK IS STILL ON THE GROUND. A BALL ROLLS UNDER YOU: HOP</b>: a beach ball rolls back and forth along the ground, through the row of Kit's feet. Ducking does not help against it, so hold ${kbd('Right')} and tap ${kbd('Space')}, and Kit hops over. The last sign, <b>A BIRD, THEN A BALL. DUCK, THEN HOP</b>, asks for one after the other.</p>`,
  },
  {
    head: 'How this level is made',
    html: `<h1>How level 2 is made</h1><ul><li><b>Which row the flier is in.</b> Open <b>two.map</b>. A bird stands in the row of Kit's head and a ball in the row of their feet. The monsters are the same kind of thing, and what each touches depends on which of Kit's pictures it overlaps.</li><li><b>A duck still has feet.</b> The crouch is a picture in the bottom block, the same block as Kit's feet. A ball rolling through it touches the crouch just as it would touch a standing Kit.${fig('ball')}</li><li><b>The hop.</b> Space is the Starter hero's jump: a push upward that gravity takes back. In the open it takes Kit more than a block clear of a ball, and holding ${kbd('Right')} as well carries them over it.</li><li><b>The awnings.</b> The first is over the high bird, so a hop cannot be used there. The ball's lane has no awning, so it can be hopped. The last has an awning over the bird only.</li><li><b>Time it.</b> Both patrol back and forth, so watch where each is and go as it comes toward you, with room beyond it. A flier turning around right beside Kit is the one that hits them.</li></ul>`,
  },
  {
    head: 'What it cannot do',
    html: `<h1>What it cannot do</h1><p>These are the engine's limits, so you can plan around them.</p><ul><li><b>Kit cannot duck and walk at once.</b> A key runs one sequence at a time. While Down is held, Kit crouches in place, and a step needs a sequence of its own on another key.</li><li><b>A duck does not make Kit smaller on the map.</b> It only changes which pictures they are drawn with, and so which pixels a monster can touch. A bird in the row of their feet, or a ball, still finds them.</li><li><b>It only works against a flier that is wholly in their head's row.</b> A monster that has a part in their bottom block touches them whatever they are doing.</li><li><b>Nothing tells the bird.</b> The bird flies the same path whether Kit ducks or not. The miss is only the pictures not overlapping.</li><li><b>A touch costs hit points every tick it lasts.</b> A long overlap, such as a bird going back and forth over them, costs more.</li></ul>`,
  },
  {
    head: 'Make it yours',
    html: `<h1>Make it yours</h1><p>Try one change at a time, and play after each:</p><ul><li>Give the first frame of the duck a top picture, and watch the birds hit them again.</li><li>Draw a different crouch, such as a roll into a ball. Only the bottom picture matters.</li><li>Move a bird down one row on the map and see that ducking no longer helps.</li><li>Make a bird faster or slower in <b>dk.mon</b>, or lengthen the path.</li><li>Put the duck on another key, and say so on a sign.</li></ul><p>The home page's <b>Starters</b> tab has more small games like this one.</p>`,
  },
];

const howDoI = [
  { id: 'duck', q: 'How do I make the hero duck?', scene: 2, x: 5, y: 6, level: 1 },
  { id: 'miss', q: 'How do I make a flying monster miss the hero?', scene: 2, x: 9, y: 6, level: 1 },
  { id: 'head', q: 'How do I put a monster at the height of the hero’s head?', scene: 2, x: 16, y: 9, level: 1 },
  { id: 'feet', q: 'How do I make a monster the hero can only hop over?', scene: 3, x: 34, y: 10, level: 2 },
  { id: 'both', q: 'How do I ask for a duck and then a hop?', scene: 3, x: 44, y: 6, level: 2 },
];

writeFileSync(new URL('../manual.json', import.meta.url), JSON.stringify({ title: 'Kit Ducks', howDoI, pages }, null, 2) + '\n');
console.log('manual.json written');

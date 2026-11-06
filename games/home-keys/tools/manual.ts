// Writes games/home-keys/manual.json: the pages of the game's manual, with the keyboard drawn as an SVG from the same
// layout the HOW TO PLAY picture uses (src/keyboardLayout.ts), so the two agree.
//   cd web && npx vite-node ../games/home-keys/tools/manual.ts && npx prettier --write ../games/home-keys/manual.json
import { writeFileSync } from 'node:fs';
import { ARROW_GLYPH, HANDS, KEYBOARD, KEYBOARD_SIZE, type KeyRole } from '../src/keyboardLayout';
import { L1, L2, L3 } from '../src/levels';

const FILL: Record<KeyRole, [string, string]> = {
  main: ['#fac828', '#96560a'],
  twin: ['#18aaaa', '#0a5a64'],
  extra: ['#d6aaff', '#46207a'],
  plain: ['#d6dcee', '#8a94b0'],
};

function keyboardSvg(): string {
  const { w, h } = KEYBOARD_SIZE;
  const keys = KEYBOARD.map((k) => {
    const [fill, edge] = FILL[k.role];
    const label = ARROW_GLYPH[k.label] ?? k.label;
    const size = label.length > 1 ? 6 : 8;
    return `<rect x="${k.x}" y="${k.y}" width="${k.w}" height="${k.h}" rx="2" fill="${fill}" stroke="${edge}"/><text x="${k.x + k.w / 2}" y="${k.y + k.h / 2 + 3}" font-size="${size}" text-anchor="middle" font-family="monospace" font-weight="bold" fill="#18142c">${label}</text>`;
  }).join('');
  const hands = HANDS.map(
    (hd) =>
      `<rect x="${hd.x}" y="${hd.y}" width="${hd.w}" height="${hd.h}" rx="10" fill="none" stroke="#5c547c" stroke-dasharray="3 3"/><text x="${hd.x + 4}" y="${hd.y + hd.h - 3}" font-size="6" font-family="monospace" fill="#5c547c">${hd.name}</text>`,
  ).join('');
  return `<svg role="img" aria-label="A keyboard. The arrow keys, Space and Enter are gold. W, A, S and D are teal. Q and E are purple. The left hand rests on W A S D with its thumb on Space, and the right hand on the arrow keys." viewBox="0 0 ${w} ${h + 12}" width="${w * 2}" style="max-width:100%;height:auto"><g>${hands}${keys}</g></svg>`;
}

const kbd = (s: string) => `<kbd>${s}</kbd>`;
const legend = `<ul><li><b>Gold</b>: the arrows, Space and Enter. The whole game can be played with these.</li><li><b>Teal</b>: W, A, S and D. The same as the arrows, for a hand that rests on the left.</li><li><b>Purple</b>: Q and E. The leaps in level 3, for extra coins only.</li><li><b>Gray</b>: every other key. The game never asks for one.</li></ul>`;

const pages = [
  {
    head: 'Welcome',
    html: `<h1>Welcome</h1><p><b>Home Keys</b> is a Starter: a small game that shows a few Game-Maker ideas, with signs in the levels that say what you are looking at. It has three short levels and takes a few minutes to finish.</p><p>Most people today have no number pad, and rest a hand on the arrow keys or on W A S D. Space and Enter, close by, do most of the work: jump and throw. So this game keeps to a few keys, says every one of them, and puts a sign where each is first needed.</p><p>Play it first. Then open it in Game-Maker (<b>Edit a copy</b> on the home page keeps the original safe) and read the pages below, which say where each thing is made.</p>`,
  },
  {
    head: 'The keys on the keyboard',
    html: `<h1>The keys on the keyboard</h1>${keyboardSvg()}${legend}<p>Either hand will do. The picture is drawn from the same list of keys as the one on the game's HOW TO PLAY page.</p>`,
  },
  {
    head: 'Every key in the instructions',
    html: `<h1>Every key in the instructions</h1><p>A game should list every key it uses, so nobody has to find one by pressing them all. Here the list is in three places that say the same thing:</p><ul><li><b>The game's HOW TO PLAY page</b>, a text page in the game's slide list (<b>howto.txt</b>), after the picture of the keyboard.</li><li><b>The controls list</b> (<b>controls.json</b>), which is what the web player's Keys panel shows. Each key has a short name and a longer sentence.</li><li><b>Signs in the levels</b>, one before the first place each key is needed.</li></ul><p>The keys it lists: ${kbd('Left')} ${kbd('Right')} (and ${kbd('A')} ${kbd('D')}) walk. ${kbd('Space')} jumps. ${kbd('Enter')} throws a star. ${kbd('Q')} ${kbd('E')} leap, in level 3 only. ${kbd('Up')} and ${kbd('Down')} (and ${kbd('W')} ${kbd('S')}) climb ladders, and there are none here. ${kbd('F2')} shows your lives and score.</p>`,
  },
  {
    head: 'Level 1: Arrows, Space, Enter',
    html: `<h1>Level 1: Arrows, Space, Enter</h1><p>The first sign says the arrow keys walk, and that A and D do too. Walk to the wall. The second sign says Space jumps, and that holding an arrow as well jumps that way: hold ${kbd('Right')}, tap ${kbd('Space')}, and Kit is over. Past the wall is a tunnel two blocks high with two green jellies in it. Walk into the first one and it holds. The third sign says ${kbd('Enter')} throws a star. Press it once for each jelly.</p>`,
  },
  {
    head: 'How this level is made',
    html: `<h1>How level 1 is made</h1><ul><li><b>Walk and jump.</b> Open <b>hero.chr</b> in the Character tab. Left, Right, Space and the A and D twins are the Starter hero's own. Each key starts one sequence of frames.</li><li><b>Throw.</b> The Enter sequence has the key set to Enter and <b>One sequence per key stroke</b> on, so a held key throws once. One frame in the middle gives birth to a monster: the star. Its second picture is the monster block marker, and its first picture is the star's number.</li><li><b>The jellies.</b> Open <b>hk.mon</b> in the Monsters tab. A jelly is solid on every side and has power 150, so Kit cannot push through it, and a star's power of 200 beats it. Nothing about it hurts.</li><li><b>The tunnel.</b> Open <b>one.map</b>: a hill of brick with a gap two blocks high, the height of Kit. With no room overhead, they cannot hop over a jelly, so the star is the way through.</li></ul>`,
  },
  {
    head: 'Level 2: No Diagonal Needed',
    html: `<h1>Level 2: No Diagonal Needed</h1><p>The coins curve up and to the right over a gap, which looks like a job for a diagonal key. It is not. Walk to the edge, tap ${kbd('Space')}, and hold ${kbd('Right')}. Kit rises and moves right at once, because two keys can be down together. The first gap has higher ground on its far side; the second is wider. A level that can be played without a diagonal is easier for everyone, so this one can.</p>`,
  },
  {
    head: 'How this level is made',
    html: `<h1>How level 2 is made</h1><ul><li><b>Two keys at once.</b> The jump is a push upward that gravity takes back, so while Kit is in the air the walking keys still work. Nothing in the character file mentions a diagonal.</li><li><b>The gaps.</b> Open <b>two.map</b>: the first gap is ${L2.pits[0][1] - L2.pits[0][0] + 1} blocks wide with ground one block higher past it, the second ${L2.pits[1][1] - L2.pits[1][0] + 1} blocks wide on the flat. A jump carries Kit about four blocks sideways while they walk, so both can be crossed.</li><li><b>The coins</b> follow the arc of the jump, so they show the way.</li></ul>`,
  },
  {
    head: 'Level 3: Leap Shelves',
    html: `<h1>Level 3: Leap Shelves</h1><p>The way to the door is flat: walk, with the arrows. Two shelves of coins sit higher than a jump reaches. Stand a little left of the first one and press ${kbd('E')}: Kit leaps up and to the right and lands on it. Walk off the end, and from the right of the second shelf press ${kbd('Q')} to leap up and to the left. They are extras. Nothing in the level needs them.</p>`,
  },
  {
    head: 'How this level is made',
    html: `<h1>How level 3 is made</h1><ul><li><b>Q and E.</b> Two sequences, each on its own key (scan codes 16 and 18). Each is a push up (16 pixels a frame, a little more than a jump) and a push to the side (11 pixels a frame), with the Momentum setting on so gravity takes the push back. One press does what Space with an arrow does, only higher.</li><li><b>The shelves.</b> Open <b>three.map</b>: planks four blocks above the ground, so a jump of three and a bit falls short, and Kit can come up through a plank from below but stands on it from above.</li><li><b>Optional on purpose.</b> The door and its path are on the ground. The check that comes with the game plays it twice: once with only the arrows, Space and Enter, and once with the leaps.</li></ul>`,
  },
  {
    head: "The number pad's diagonals: a little history",
    html: `<h1>The number pad's diagonals: a little history</h1><p>Keyboards in the early 1990s had a number pad on the right, and its keys doubled as cursor keys. 8, 4, 6 and 2 were up, left, right and down, and 7, 9, 1 and 3 were the diagonals: up-left, up-right, down-left and down-right. Games for such keyboards used them to move diagonally with one finger.</p><p>Game-Maker can bind a sequence to any key by its scan code, and the number pad's are 71 (7), 73 (9), 79 (1) and 81 (3). The web player also takes Home, Page Up, End and Page Down for those same four, because they share a code.</p><p>Most laptops today have no number pad, so a game that needs 7 or 9 locks those players out. When a diagonal is worth having, Q and E, next to W A S D, are within reach of the left hand, and that is what this game uses. A game could do both: bind a leap to Q and to the number pad's 7, with two sequences, and say both in its instructions. Home Keys does not, to stay small.</p>`,
  },
  {
    head: 'What it cannot do',
    html: `<h1>What it cannot do</h1><ul><li>A sequence has one key. Q, W and the number pad's 7 would each need a sequence of their own, and a character file holds twenty.</li><li>A key is a key, not a direction. There is no way for the game to ask whether Left and Up are down together, so a diagonal move is a sequence of its own.</li><li>The game can list its keys on a page, but cannot show a sign only the first time a key is used. The signs stand where the key is first needed, and are always there.</li><li>A star flies about six blocks, and goes the way Kit last walked.</li></ul>`,
  },
  {
    head: 'Make it yours',
    html: `<h1>Make it yours</h1><p>Try one change at a time, and play after each:</p><ul><li>Change the jump key on the Character tab to a different key, then fix the sign and the controls list to match.</li><li>Make a third leap on the number pad's 7 (scan code 71) the same as Q.</li><li>Lower a shelf until a plain jump reaches it, and see how the level feels without a reason for E.</li><li>Add a second jelly beside the first, and throw twice.</li></ul><p>The home page's <b>Starters</b> tab has more small games like this one. Kit's Moves shows what a key does while it is held.</p>`,
  },
];

const howDoI = [
  { id: 'listkeys', q: 'How do I tell the player which keys the game uses?', scene: 2, x: 6, y: L1.ground - 1, level: 1 },
  { id: 'jumpkey', q: 'How do I put a jump on the Space key?', scene: 2, x: 12, y: L1.ground - 1, level: 1 },
  { id: 'throw', q: 'How do I make Enter throw a star?', scene: 2, x: 25, y: L1.ground - 1, level: 1 },
  { id: 'nodiag', q: 'How do I get across a gap without a diagonal key?', scene: 3, x: 6, y: L2.ground - 1, level: 2 },
  { id: 'leap', q: 'How do I add a key that leaps up and sideways?', scene: 4, x: 8, y: L3.ground - 1, level: 3 },
  { id: 'numpad', q: "How do I use the number pad's diagonal keys?", scene: 4, x: 28, y: L3.ground - 1, level: 3 },
];

writeFileSync(new URL('../manual.json', import.meta.url), JSON.stringify({ title: 'Home Keys', howDoI, pages }, null, 2) + '\n');
console.log(`manual.json: ${pages.length} pages, ${howDoI.length} questions`);

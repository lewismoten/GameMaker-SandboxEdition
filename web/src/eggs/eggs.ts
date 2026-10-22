// The eight felt eggs hidden in the Sandbox games: one per game, each carrying a few names
// (easter eggs began as authors' hidden credits) and one piece of a small mystery.
//
// HOW AN EGG IS DETECTED (the convention every game follows)
//   The egg is something the player's character CARRIES, so it ends up in the game's save:
//   PLAYGAME's Save Game (F-key menu) writes game<n>.sav (n = 0..9) into the game's save data
//   (web/src/project/storage.ts, keyed `game:<id>`). This port writes it as JSON whose
//   world.ci holds the character's state: `inv` (the 10 inventory slots, background block
//   numbers) and `meter` (the 30 counters; 20..29 are the general counters blocks change).
//   An egg is "found" when ANY saved slot of its game holds it, as `detect` says:
//     { block: N }               block N is in world.ci.inv (the egg is an inventory pickup:
//                                a background block with the Pick-up flag; pick it up and keep it)
//     { counter: N, atLeast: M } world.ci.meter[N] >= M (M defaults to 1)
//   Prefer `block`. N must be a block no other pickup in that game uses, in any of its
//   block sets (the inventory keeps only numbers). The game's about.json carries the same
//   object as its "egg" field (e.g. "egg": { "block": 87 }) for the record; this file is what
//   the desk reads at run time, so set `detect` here too. Until `detect` is set, a game's egg
//   can only be found by EGG.EXE.
//
// EGG.EXE (an unlisted program on the desk PC) can also add or break eggs; those overrides
// live in localStorage under `gm-eggs` (see eggState.ts) and never touch a save.

export type EggDetect = { block: number } | { counter: number; atLeast?: number };

/** How the viewer stitches an egg: felt colors, a band pattern and an appliqué. */
export interface EggLook {
  /** Felt colors: the shell, the bands, the appliqué, the thread. */
  felt: string;
  band: string;
  patch: string;
  thread: string;
  pattern: 'zigzag' | 'dots' | 'stars' | 'snowflakes' | 'scallops' | 'checks' | 'waves' | 'circuit';
  motif: 'paw' | 'castle' | 'mitten' | 'bolt' | 'planet' | 'mask' | 'rocket' | 'bug';
}

export interface Egg {
  /** The Sandbox game it is hidden in (games/<id>). */
  game: string;
  gameTitle: string;
  name: string;
  /** The felt egg itself, as the viewer describes it. */
  description: string;
  credits: string[];
  /** Its piece of the mystery. */
  lore: string;
  look: EggLook;
  /** Set by the games once the egg is in the game; see the top of this file. */
  detect?: EggDetect;
}

export const EGGS: readonly Egg[] = [
  {
    game: 'blaster',
    gameTitle: 'Virus Blaster',
    name: 'The Debug Egg',
    description: 'Charcoal felt crossed with lime-green circuit traces in backstitch, a little felt bug sewn on with six French-knot legs, and a ribbon of tiny white chip pins around the waist.',
    credits: ['The whole Sandbox crew: Claude Opus 5.5, Lewis "Lewie" Moten III, Teddy, Gwinn and Doc Leo'],
    lore: 'Found in a corner of memory: COUNTER.LOG. Its last line reads "Word 100 of 100 ... STOP." Everything after it is static.',
    look: { felt: '#2b2f36', band: '#7cd63a', patch: '#e8443a', thread: '#d8f5c0', pattern: 'circuit', motif: 'bug' },
    detect: { block: 149 },
  },
  {
    game: 'logic',
    gameTitle: 'Ohm Sweet Ohm',
    name: 'The Live Wire Egg',
    description: 'Copper-orange felt with a yellow lightning bolt appliquéd on each side, a zigzag of black running stitch like a resistor, and a tiny brass button for a terminal on top.',
    credits: ['Wired up by Claude Opus 5.5'],
    lore: 'Taped inside the fuse box: a meter marked WORDS. The needle sits at exactly one hundred, and no amount of current will move it.',
    look: { felt: '#d9762b', band: '#2a1a10', patch: '#ffd23f', thread: '#fff1c4', pattern: 'zigzag', motif: 'bolt' },
  },
  {
    game: 'maximus',
    gameTitle: 'Maximus: The Hundred Worlds',
    name: 'The Orbit Egg',
    description: 'Midnight-blue felt scattered with silver star stitches, a ringed felt planet in plum and gold on its belly, and one long orbit of white chain stitch looping all the way around.',
    credits: ['Charted by Claude Opus 5.5', 'and Lewis "Lewie" Moten III'],
    lore: 'Between worlds it hums a catalog number. A hundred worlds, a hundred words: somebody out there is very particular about the number.',
    look: { felt: '#1b2350', band: '#c9d3ff', patch: '#8a4fb0', thread: '#ffffff', pattern: 'stars', motif: 'planet' },
    detect: { block: 129 },
  },
  {
    game: 'sandcast',
    gameTitle: 'Sandcastle Knight',
    name: 'The Sandcastle Egg',
    description: 'Sandy tan felt with blue scalloped waves at its base, a turreted felt castle with a pink pennant, and a single brown paw print stitched by the moat. Gwinn swears she had nothing to do with it.',
    credits: ['Dug up by Gwinn', 'with help (and a nap) from Teddy'],
    lore: 'Pressed into the wet sand beside it: one word, "ONCE," and then nothing. As if the rest of the story just fell out.',
    look: { felt: '#e6c48a', band: '#3d8fd1', patch: '#c9573a', thread: '#fff6e0', pattern: 'scallops', motif: 'castle' },
  },
  {
    game: 'sleuth',
    gameTitle: 'Final Curtain',
    name: 'The Velvet Curtain Egg',
    description: 'Deep theater-red felt with gold checkerboard trim, a black-and-white comedy mask appliquéd on the front, and a gold thread curtain-tie stitched around the middle.',
    credits: ['Performed by Doc Leo, hobo clown (standing backward in line, as usual)'],
    lore: 'The case notes say every word fell out of every book in town on the same night. The last line, underlined twice: "Check the little library with the red door."',
    look: { felt: '#8e1d2c', band: '#d6a53a', patch: '#f4f0e6', thread: '#f2cf6b', pattern: 'checks', motif: 'mask' },
    detect: { counter: 25, atLeast: 2 },
  },
  {
    game: 'snowbound',
    gameTitle: 'Snowbound: The $89 Shovel',
    name: 'The Mitten Egg',
    description: 'Fluffy white felt with blue snowflakes in lazy-daisy stitch, a red mitten appliqué with a cuff of real yarn, and a scarf of red and green stripes wrapped around its middle.',
    credits: ['Shoveled out by Lewis "Lewie" Moten III, winter of 1992'],
    lore: 'A note was frozen to it: "The Word Counter jammed at ninety-nine. Bring a shovel and come quick."',
    look: { felt: '#f4f6fb', band: '#3a6fc4', patch: '#d23a2e', thread: '#2a4f9a', pattern: 'snowflakes', motif: 'mitten' },
    detect: { block: 137 },
  },
  {
    game: 'teddy',
    gameTitle: "Teddy's Little Big Adventure",
    name: 'The Big Top Egg',
    description: 'Felted like Doc Leo\'s own clown egg: cream felt with red big-top stripes, rainbow polka dots, a corgi-orange paw print on each side and a tiny red pom-pom nose on top.',
    credits: ['Starring Teddy, a corgi who knows left from right', 'and Doc Leo, PhD (Comedic Science)'],
    lore: 'Teddy found it by the red door of The Dog House. Every book inside was there, but every page was blank.',
    look: { felt: '#fff3dc', band: '#d9381e', patch: '#e88a2c', thread: '#1d5fb8', pattern: 'dots', motif: 'paw' },
  },
  {
    game: 'year2000',
    gameTitle: 'In The Year 2000!',
    name: 'The Tomorrow Egg',
    description: 'Shiny teal felt with silver wave stitching, a red felt rocket with a flame of orange yarn, and a band of chrome sequins around the middle like a 1950s idea of the future.',
    credits: ['Sent from the future by Lewis "Lewie" Moten III', 'and Claude Opus 5.5'],
    lore: 'A postcard from the future: "Stories got so small they fit in your pocket. Somebody still has to count every word back in."',
    look: { felt: '#1f9a9a', band: '#c8d4dc', patch: '#e2412f', thread: '#eaf6f6', pattern: 'waves', motif: 'rocket' },
    detect: { block: 149 },
  },
];

export const eggFor = (game: string): Egg | undefined => EGGS.find((e) => e.game === game);

// The thirteen felt eggs hidden in the Sandbox games: one per game, each carrying a few names
// (easter eggs began as authors' hidden credits) and one piece of a small mystery about a
// family root beer recipe that keeps asking for one more than anybody has. However many there
// are, the mystery's last egg is always the one more: it is never one of these.
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
  pattern: 'zigzag' | 'dots' | 'stars' | 'snowflakes' | 'scallops' | 'checks' | 'waves' | 'circuit' | 'ruled' | 'pawprints' | 'grid' | 'diamonds' | 'confetti';
  motif: 'paw' | 'castle' | 'mitten' | 'bolt' | 'planet' | 'mask' | 'rocket' | 'bug' | 'bookworm' | 'bone' | 'cube' | 'sword' | 'cake';
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
  /** Set once the egg is in the game; see the top of this file. */
  detect?: EggDetect;
}

export const EGGS: readonly Egg[] = [
  {
    game: 'blaster',
    gameTitle: 'Virus Blaster',
    name: 'The Debug Egg',
    description:
      'Charcoal felt crossed with lime-green circuit traces in backstitch, a little felt bug sewn on with six French-knot legs, and a ribbon of tiny white chip pins around the waist.',
    credits: ['The whole Sandbox crew: Claude Opus 5.5, Lewis "Lewie" Moten III, Teddy, Gwinn and Doc Leo'],
    lore: 'Recovered from a bad sector: RECIPE.TXT, part 1 of 13. All that survives is "...stir counterclockwise, or the Redcoats win," a checksum error, and a faint smell of sassafras.',
    look: { felt: '#2b2f36', band: '#7cd63a', patch: '#e8443a', thread: '#d8f5c0', pattern: 'circuit', motif: 'bug' },
    detect: { block: 149 },
  },
  {
    game: 'brief',
    gameTitle: 'KEEP IT BRIEF! The Tiny Pockets Library',
    name: 'The Bookworm Egg',
    description:
      'Cream felt ruled with pale lines like a notebook page and blanket-stitched in gold, a green felt bookworm in red reading glasses curled around its middle, and a red ribbon bookmark hanging from the top.',
    credits: [
      'Felted by Lewis "Lewie" Moten III, who felted a Doc Leo clown egg first',
      'Shelved by Claude Opus 5.5',
      'Chewed (slightly) by Teddy, hidden by Gwinn, guarded by Doc Leo (facing the wrong way)',
    ],
    lore: 'Tucked under the ribbon, filed under 641.5 (cookbooks): a recipe card, stained brown and still a little fizzy. "ROOT BEER. Serves a baker\'s dozen. For ingredient 13, see other side." The other side is overdue.',
    look: { felt: '#f6efdc', band: '#d6a53a', patch: '#4f9a3a', thread: '#2a1408', pattern: 'ruled', motif: 'bookworm' },
    detect: { block: 149 },
  },
  {
    game: 'depth',
    gameTitle: 'Depth Perception',
    name: 'The Prism Egg',
    description:
      'Glossy black felt laid with a vanishing checkerboard floor in silver chain stitch, a faceted felt cube in three shades of violet so it reads as solid, and a rainbow of floss where the light comes through.',
    credits: ['Rendered by Claude Opus 5.5, one ray at a time', 'Lit by Doc Leo, who insisted on a spotlight'],
    lore: 'Left rendering all night at 320x200: a perfect kitchen, a pot on every burner, a carton of thirteen eggs. In the chrome kettle, one reflection too many. Nobody can find its egg.',
    look: { felt: '#15121f', band: '#b9c0d8', patch: '#7a4fd0', thread: '#e8e4ff', pattern: 'grid', motif: 'cube' },
    detect: { block: 149 },
  },
  {
    game: 'logic',
    gameTitle: 'Ohm Sweet Ohm',
    name: 'The Live Wire Egg',
    description:
      'Copper-orange felt with a yellow lightning bolt appliquéd on each side, a zigzag of black running stitch like a resistor, and a tiny brass button for a terminal on top.',
    credits: ['Wired up by Claude Opus 5.5'],
    lore: 'Taped inside the fuse box: "KITCHEN CIRCUIT. DO NOT TRIP DURING THE BOIL." Under it, in much older ink: "The stove was never the secret ingredient."',
    look: { felt: '#d9762b', band: '#2a1a10', patch: '#ffd23f', thread: '#fff1c4', pattern: 'zigzag', motif: 'bolt' },
    detect: { block: 149 },
  },
  {
    game: 'maximus',
    gameTitle: 'Maximus: The Hundred Worlds',
    name: 'The Orbit Egg',
    description:
      'Midnight-blue felt scattered with silver star stitches, a ringed felt planet in plum and gold on its belly, and one long orbit of white chain stitch looping all the way around.',
    credits: ['Charted by Claude Opus 5.5', 'and Lewis "Lewie" Moten III'],
    lore: 'Between worlds it hums a count: thirteen, thirteen, thirteen. Then one more beat, out of time, like somebody tapping a wooden spoon on the rim of a pot.',
    look: { felt: '#1b2350', band: '#c9d3ff', patch: '#8a4fb0', thread: '#ffffff', pattern: 'stars', motif: 'planet' },
    detect: { block: 129 },
  },
  {
    game: 'realm',
    gameTitle: 'Quest for the Round Tuit',
    name: 'The Heraldry Egg',
    description:
      "Forest-green felt quartered in gold diamonds like a herald's coat, a silver felt sword laid over a scrap of treasure map, and a road of brown backstitch winding all the way around the shell.",
    credits: ['Questmaster Gwinn (three quests, never once asked for directions)', 'Map inked by Lewis "Lewie" Moten III', 'Roads curved by Claude Opus 5.5'],
    lore: 'The royal map ends at the edge of the kingdom with "Here Be Root Beer," and a line the cartographer was far too polite to finish: "Taken from the Redcoats, fair and square, on a Tuesday, by..."',
    look: { felt: '#2f5d3a', band: '#d8b04a', patch: '#c9ced6', thread: '#f4e7c0', pattern: 'diamonds', motif: 'sword' },
    detect: { block: 149 },
  },
  {
    game: 'sandcast',
    gameTitle: 'Sandcastle Knight',
    name: 'The Sandcastle Egg',
    description:
      'Sandy tan felt with blue scalloped waves at its base, a turreted felt castle with a pink pennant, and a single brown paw print stitched by the moat. Gwinn swears she had nothing to do with it.',
    credits: ['Dug up by Gwinn', 'with help (and a nap) from Teddy'],
    lore: 'Pressed into the wet sand: "ONCE," then a measuring cup, a ladle and thirteen little egg shapes in a row. One more sits apart, half dug, as if somebody got called in for supper.',
    look: { felt: '#e6c48a', band: '#3d8fd1', patch: '#c9573a', thread: '#fff6e0', pattern: 'scallops', motif: 'castle' },
    detect: { block: 146 },
  },
  {
    game: 'sleuth',
    gameTitle: 'Final Curtain',
    name: 'The Velvet Curtain Egg',
    description:
      'Deep theater-red felt with gold checkerboard trim, a black-and-white comedy mask appliquéd on the front, and a gold thread curtain-tie stitched around the middle.',
    credits: ['Performed by Doc Leo, hobo clown (standing backward in line, as usual)'],
    lore: 'Case 13, never closed: one recipe card lifted in 1776, one root beer the family will not discuss, one kitchen door with flour on the knob. Last note, underlined twice: "Count the eggs again. A baker always does."',
    look: { felt: '#8e1d2c', band: '#d6a53a', patch: '#f4f0e6', thread: '#f2cf6b', pattern: 'checks', motif: 'mask' },
    detect: { counter: 25, atLeast: 2 },
  },
  {
    game: 'snowbound',
    gameTitle: 'Snowbound: The $89 Shovel',
    name: 'The Mitten Egg',
    description:
      'Fluffy white felt with blue snowflakes in lazy-daisy stitch, a red mitten appliqué with a cuff of real yarn, and a scarf of red and green stripes wrapped around its middle.',
    credits: ['Shoveled out by Lewis "Lewie" Moten III, winter of 1992'],
    lore: 'A note frozen to it: "Bring every egg to the kitchen before the root beer goes flat. All of them. Yes, even that one. ESPECIALLY that one."',
    look: { felt: '#f4f6fb', band: '#3a6fc4', patch: '#d23a2e', thread: '#2a4f9a', pattern: 'snowflakes', motif: 'mitten' },
    detect: { block: 137 },
  },
  {
    game: 'teddy',
    gameTitle: "Teddy's Little Big Adventure",
    name: 'The Big Top Egg',
    description:
      "Felted like Doc Leo's own clown egg: cream felt with red big-top stripes, rainbow polka dots, a corgi-orange paw print on each side and a tiny red pom-pom nose on top.",
    credits: ['Starring Teddy, a corgi who knows left from right', 'and Doc Leo, PhD (Comedic Science)'],
    lore: 'Teddy found it by the red door of The Dog House, at the end of a trail of sugar, vanilla and something fizzy. He followed it as far as the kitchen and was told, firmly, "Not yet."',
    look: { felt: '#fff3dc', band: '#d9381e', patch: '#e88a2c', thread: '#1d5fb8', pattern: 'dots', motif: 'paw' },
    detect: { block: 149 },
  },
  {
    game: 'teddy2',
    gameTitle: "Teddy's Little Bigger Adventure",
    name: 'The Second Paw Egg',
    description:
      'Butterscotch felt walked all over with little brown paw prints, a white felt bone appliquéd on each side with a red bow tied round it, and a collar of blue rickrack with a tiny brass tag that reads "2".',
    credits: ['Starring Teddy, a little bigger this time', 'Stunts by Gwinn, uncredited at her own request'],
    lore: 'Buried with the bone: a wooden spoon, well gnawed and still sticky. Teddy will not say where he got it, but he keeps looking toward the kitchen and licking his nose.',
    look: { felt: '#e3a857', band: '#3a6fc4', patch: '#fbf6ea', thread: '#5a3216', pattern: 'pawprints', motif: 'bone' },
    detect: { block: 149 },
  },
  {
    game: 'teddy3',
    gameTitle: "Teddy's Little Biggest Adventure",
    name: 'The Birthday Egg',
    description:
      'Lilac felt sprinkled with confetti knots in every color, a pink felt birthday cake appliquéd on each side with three yarn candles, and a collar of gold rickrack with a tiny brass tag that reads "3".',
    credits: ['Starring Teddy, the biggest he has ever been', 'Party planned by Gwinn and Doc Leo, who never once said so', 'Stitched by Claude Opus 5.5'],
    lore: 'Tucked in with the lost party hats in the hedge: a place card in Doc Leo\'s hand. "ONE MORE CHAIR AT THE TABLE. Keep it for whoever is still coming." Teddy sat in it anyway.',
    look: { felt: '#b48ce0', band: '#ffd23f', patch: '#f59ac0', thread: '#ffffff', pattern: 'confetti', motif: 'cake' },
    detect: { block: 149 },
  },
  {
    game: 'year2000',
    gameTitle: 'In The Year 2000!',
    name: 'The Tomorrow Egg',
    description:
      'Shiny teal felt with silver wave stitching, a red felt rocket with a flame of orange yarn, and a band of chrome sequins around the middle like a 1950s idea of the future.',
    credits: ['Sent from the future by Lewis "Lewie" Moten III', 'and Claude Opus 5.5'],
    lore: 'A postcard from the future: "The grandkids still argue over the family root beer. The recipe calls for thirteen of something. Thirteen eggs, it turns out, are not it."',
    look: { felt: '#1f9a9a', band: '#c8d4dc', patch: '#e2412f', thread: '#eaf6f6', pattern: 'waves', motif: 'rocket' },
    detect: { block: 149 },
  },
];

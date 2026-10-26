// Teddy's special egg, The Lay-an-Egg Egg: once the felt eggs of all three of his adventures
// are found, Teddy lays one of his own, a little pile of felt sausages with a whiff rising
// (eggPile.ts). It sits at the end of the shadow box (eggDisplay.ts), has a page of its own
// after the felt eggs in the viewer (eggViewer.ts), and EGG.EXE says so. It is a bonus: never one of
// the felt eggs (eggs.ts), so never in their count or in anything they unlock.

/** The games whose felt eggs earn it, in order. */
export const TEDDY_GAMES = ['teddy', 'teddy2', 'teddy3'] as const;

/** Has every Teddy adventure's felt egg been found? (`found`: the games whose eggs are.) */
export const hasTeddyEgg = (found: Iterable<string>): boolean => {
  const have = new Set(found);
  return TEDDY_GAMES.every((g) => have.has(g));
};

/** For the hidden achievement: only finds made in a game count, not ones EGG.EXE adds by hand. */
export const laidFromSaves = (states: readonly { inSave: boolean; egg: { game: string } }[]): boolean =>
  hasTeddyEgg(states.filter((x) => x.inSave).map((x) => x.egg.game));

/** What it is, for its card in the viewer. */
export const TEDDY_EGG = {
  name: 'The Lay-an-Egg Egg',
  caption: 'Teddy’s special egg, for finding the felt eggs in all three of his adventures',
  description:
    'Chocolate-brown felt rolled into three chubby little sausages and piled up, sewn in tan thread where they touch, with curls of green-gray yarn rising off the top. Technically, an egg.',
  credits: ['Laid by Teddy, on command', 'Doc Leo, who said "Lay an egg!"', 'Stitched by Claude Opus 5.5'],
  lore: 'Three felt eggs found, one in each of his adventures, and Teddy wanted one of his own. On walks he hunches up like a little rabbit, so Doc Leo tells him, "Lay an egg!", like the candy bunny that lays chocolate ones. This time he did. A note pinned beside it: "Good boy. Not one for the basket."',
} as const;

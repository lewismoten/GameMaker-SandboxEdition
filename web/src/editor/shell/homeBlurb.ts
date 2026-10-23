// The few lines about a game in the home page's panel. The catalog's blurb for a CD game
// is the start of its story screen, which can open with an ALL-CAPS heading ("PLANETARY
// COALITION"), a key chart, or RSD's address, and stops mid-sentence. Here a heading is
// dropped and the text ends on a whole sentence; a few games whose screens don't read as a
// description have a short one written from their story instead.

/** Written from the game's own story or instruction screen, where that screen doesn't read well on its own. */
const WRITTEN: Record<string, string> = {
  library: 'Pictures, monsters, heroes and sounds from the Game-Maker CD, ready to build your own game with.',
  terrain:
    'Not really a game: roam a scene built from the Terrain picture blocks and get ideas of what Game-Maker can do. Pick up the laser gun first, and stay clear of your own bombs.',
  tutor: 'Not a game but a tour of Game-Maker’s features: walk around one scene to see scrolling, solid blocks, one-way doors and more at work.',
  houses: 'Shows how to build houses out of the HOUSES blocks, and how the hero can change into another character: follow the green path to change.',
  zark: 'An evil race from Alpha Centauri is coming to wreck your newly terraformed base on Venus. Take the most powerful ship on the planet and prepare for trouble.',
  bcuda:
    'Classified: an Iraqi fleet carrying parts for a nuclear weapon has been sunk. As the submarine “Barracuda”, recover the pieces from the wrecks before the Iraqi warships do.',
  peach:
    'Evil Fang Duck has set out to take over the land of Norumbega and fill it with ducks. Peach, the fastest land lobster around, sneaks in armed only with a claw gun.',
  ajquest:
    'Evil Prince Ostro has captured A-J Bear and his hedgehog Hedge. Escape the warehouse, get past the giant pretzels and win the frozen princes’ crowns to save Beartown.',
  congress: 'The congressmen are coming! Fight through The City, InflationLand, the IRS Office and RecessionLand to stop the Majority Leader taxing the city.',
  heart:
    'Earth’s labs on newly terraformed Venus have sent “Patchwork Heart”, a self-propelled ball of uranium, deep into the planet’s crust to destroy the monsters that appeared there.',
  zoom: 'A-J Bear tells how his cousin Zoom became super. It was all an accident: Zoom walked into Grandpa Merlin’s den in the middle of a spell.',
  pac: 'Guide PAC through the Andims, spitting out power orbs at whatever gets in the way. A hard one: don’t give up too early.',
  orb: 'The mechanical world of Chara 4 has picked one of its Orbs to answer a strange call for help: either to save the world, or to show it was a hoax.',
};

/** A heading at the start: words in capitals (with numbers, quotes and the like) before ordinary text. */
const HEADING = /^(?:["'(]?(?:[A-Z0-9][A-Z0-9'&.,:#!-]*)["')]?\s+)+(?=[A-Z][a-z])/;

/** About as much as the panel shows (four or five lines). */
const MAX = 220;

/**
 * Ends the text on a whole sentence: as many as fit in MAX characters, or the first one
 * when even that is longer. Text cut short ("…") with no sentence end in it stays as it is.
 */
function wholeSentences(text: string): string {
  const cut = text.endsWith('…') ? text.slice(0, -1) : text;
  if (cut === text && text.length <= MAX) return text;
  const ends = [...`${cut} `.matchAll(/[.!?]["')]?(?=\s)/g)].map((m) => m.index! + m[0].length).filter((i) => i >= 40);
  const last = ends.filter((i) => i <= MAX).pop() ?? ends[0];
  return last ? cut.slice(0, last) : text;
}

/** The game's description as it should read on the page, or undefined when there is nothing worth showing. */
export function readableBlurb(id: string, blurb: string | undefined): string | undefined {
  if (WRITTEN[id]) return WRITTEN[id];
  if (!blurb) return undefined;
  let text = blurb.replace(/\s+/g, ' ').trim();
  // ALL-CAPS headings ("PLANETARY COALITION", "CHAPTER I", "THE OUTER LIMITS")
  const head = HEADING.exec(text);
  if (head && head[0].replace(/[^A-Za-z]/g, '').length >= 4) text = text.slice(head[0].length);
  // a key chart or a list of keys is no description
  if (/[|~_]{3}/.test(text)) return undefined;
  return wholeSentences(text) || undefined;
}

// What a game's World Map (worldMap.ts) is drawn as, from what the game is: a star chart for
// a game across a galaxy, a circuit board for one inside a computer, a floor plan for one
// indoors, a library's plan for one among books, a street map for one round town, a
// draftsman's grid for one inside a renderer, and an old map of the land for the rest. It is
// read from the game's title and blurb; HINTS names the theme where those don't tell it.
import type { CatalogEntry } from '../../project/files';

export type ThemeId = 'land' | 'space' | 'town' | 'rooms' | 'library' | 'board' | 'grid';

export interface Theme {
  id: ThemeId;
  /** The cartouche's line under the title. */
  subtitle: string;
  /** What the map calls its places ("12 worlds"). */
  places: string;
  /** The key's words: a place, a way both ways, a way one way, a region. */
  key: { place: string; both: string; one: string; region: string };
}

const THEMES: Record<ThemeId, Omit<Theme, 'id'>> = {
  land: {
    subtitle: 'A Map of the Known World',
    places: 'places',
    key: { place: 'A place: where you arrive in it', both: 'A road there and back', one: 'One way only', region: 'A land of its own' },
  },
  space: {
    subtitle: 'A Star Chart',
    places: 'worlds',
    key: { place: 'A world: where you land on it', both: 'A warp lane there and back', one: 'A one-way jump', region: 'A sector' },
  },
  town: {
    subtitle: 'A Street Map',
    places: 'stops',
    key: { place: 'A stop: where you arrive in it', both: 'A two-way street', one: 'One way only', region: 'A neighborhood' },
  },
  rooms: {
    subtitle: 'A Floor Plan',
    places: 'rooms',
    key: { place: 'A room: where you come in', both: 'A hall there and back', one: 'One way only', region: 'Rooms that open onto each other' },
  },
  library: {
    subtitle: 'A Plan of the Stacks',
    places: 'rooms',
    key: { place: 'A room: where you come in', both: 'An aisle there and back', one: 'One way only', region: 'A wing and its shelves' },
  },
  board: {
    subtitle: 'A Circuit Diagram',
    places: 'stages',
    key: { place: 'A stage: where you come in', both: 'A trace there and back', one: 'One way only', region: 'A part of the board' },
  },
  grid: {
    subtitle: 'A Draftsman’s Plan',
    places: 'scenes',
    key: { place: 'A scene: where you arrive in it', both: 'A way there and back', one: 'One way only', region: 'A scene and its planes' },
  },
};

/** Games whose title and blurb don't say what their map should be. */
const HINTS: Record<string, ThemeId> = {
  logic: 'rooms', // the Smart Home's rooms, though Watt rolls through their circuit boards
  risi: 'town', // the streets of Rome, though one song is at the theater
  teddy3: 'town', // errands round the town of the first two adventures
  year2000: 'town', // a town of tomorrow, with a trip to the Moon
  needle: 'land', // the road through the desert to the needle's eye
  loaf: 'land', // the hillside by the sea, though the loaf rides home
};

/** Words in a game's title or blurb that say what its map is, first match wins. */
const WORDS: [RegExp, ThemeId][] = [
  [/\b(galax\w*|planets?|nebulae?|star-shards?|spaceships?)\b/i, 'space'],
  [/\b(motherboard|circuit boards?|cpu|chipset)\b/i, 'board'],
  [/\b(ray-trac\w*|polygons?|render\w*)\b/i, 'grid'],
  [/\b(librar(y|ies|ian)|bookshelf|bookshelves)\b/i, 'library'],
  [/\b(kingdoms?|realms?|dungeons?|role-playing)\b/i, 'land'],
  [/\b(kitchens?|cellars?|theat(er|re)s?|houses?|homes?|rooms?|bathrooms?|showers?|fridges?|couch|walls?)\b/i, 'rooms'],
  [/\b(towns?|city|streets?|roads?|backyard|neighborhood|fair|mall)\b/i, 'town'],
];

/** The theme a game's World Map is drawn in. */
export function themeOf(entry: Pick<CatalogEntry, 'id' | 'title' | 'blurb'>): Theme {
  const text = `${entry.title} ${entry.blurb ?? ''}`;
  const id = HINTS[entry.id] ?? WORDS.find(([re]) => re.test(text))?.[1] ?? 'land';
  return { id, ...THEMES[id] };
}

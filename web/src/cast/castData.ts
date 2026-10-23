// The cast page (#/cast): the characters and things that turn up in more than one of this
// edition's new games, and the three kinds of games on the home page. Each picture is drawn
// from a game's own files by scripts/castArt.ts into public/cast/<id>.png (a few hundred bytes
// each); a test checks every "Appears in" game is in the catalog under the title given here.

export type Family = 'sandbox' | 'bizarre';

/** The new games the cast appears in: their catalog title and who published them. */
export const CAST_GAMES = {
  blaster: ['Virus Blaster', 'sandbox'],
  brief: ['KEEP IT BRIEF! The Tiny Pockets Library', 'sandbox'],
  depth: ['Depth Perception', 'sandbox'],
  logic: ['Ohm Sweet Ohm', 'sandbox'],
  maximus: ['Maximus: The Hundred Worlds', 'sandbox'],
  realm: ['Quest for the Round Tuit', 'sandbox'],
  sandcast: ['Sandcastle Knight', 'sandbox'],
  sleuth: ['Final Curtain', 'sandbox'],
  snowbound: ['Snowbound: The $89 Shovel', 'sandbox'],
  teddy: ['Teddy’s Little Big Adventure', 'sandbox'],
  teddy2: ['Teddy’s Little Bigger Adventure', 'sandbox'],
  year2000: ['In The Year 2000!', 'sandbox'],
  carl: ['A Fly Named Carl', 'bizarre'],
  goat: ['Third Goat from the Left', 'bizarre'],
  loaf: ['Loaf #13 (Left in the Basket)', 'bizarre'],
  loofah: ['Cleanse Me, O Loofah, But Leave My Soul', 'bizarre'],
  mustard: ['Mustard Seed Hustle', 'bizarre'],
  needle: ['Thread the Needle, Brother Camel', 'bizarre'],
  reckoning: ['The Great Dairy Reckoning of 3:17 A.M.', 'bizarre'],
  remote: ['Where’s the Remote?!', 'bizarre'],
  risi: ['Veni, Vidi, Risi!', 'bizarre'],
  smirked: ['I Screamed, She Smirked', 'bizarre'],
  sweats: ['Shakespeare in Sweatpants', 'bizarre'],
  tickle: ['Certified Rat Tickler', 'bizarre'],
} as const satisfies Record<string, readonly [string, Family]>;

export type CastGame = keyof typeof CAST_GAMES;

export interface Appearance {
  game: CastGame;
  /** What they do there, a few words. */
  as: string;
}

export interface CastMember {
  id: string;
  name: string;
  /** One line under the name: what they are. */
  role: string;
  /** public/cast/<id>.png, drawn from this game's files (scripts/castArt.ts). */
  art: { game: CastGame; width: number; height: number; alt: string };
  bio: string;
  appears: Appearance[];
}

export const CAST: CastMember[] = [];

/** The families a member belongs to, from the games they appear in. */
export const familiesOf = (m: CastMember): Family[] => [...new Set(m.appears.map((a) => CAST_GAMES[a.game][1] as Family))];

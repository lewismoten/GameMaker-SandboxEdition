// Catalog entry types and historical credits for the Sample CD's games.
import type { LibraryFileFact } from './libraryFacts';
import type { PrintablesFile } from '../src/manual/printables/types';
import type { Issue } from '../src/project/health';
import type { BoxGame } from '../src/desk/boxes/boxFacts';

export interface CdCatalogEntry {
  id: string;
  title: string;
  kind: 'gameware' | 'shareware';
  /** Folder of the game's files, relative to the site root. */
  path: string;
  gam: string | null;
  files: string[];
  /** Size of each file in `files`, in bytes. */
  sizes: number[];
  /** Palette identities and sound groups, for library browsing without fetching every game. */
  fileFacts?: Record<string, LibraryFileFact>;
  /** Shareware: the author's notice (readme / order form), as text. */
  notice?: string;
  /** Shareware: CRC-32 of the .gam file, to recognize the game when imported. */
  gamCrc?: number;
  /** Total size of the game's files in bytes. */
  bytes: number;
  /** Shareware: the name of its DOS program (listed on the retro PC; never served). */
  exe?: string;
  /** Original games: the 8.3 name of the ZIP and folders in DOS (about.json), when the id is longer. */
  dosName?: string;
  /** A few lines from the game's own story or instruction screen. */
  blurb?: string;
  author?: string;
  company?: string;
  year?: number;
  price?: string;
  /** Original games (../games): the disk label, box art and manual, from about.json. */
  original?: OriginalExtras;
  /** Original games: about.json "series" ("bizarre": The Bard of Bizarre's games, src/project/bizarre.ts). */
  series?: string;
  /** games/catalog.json: the entry has a games/details/<id>.json (see slimCatalog). */
  details?: boolean;
  /** Original games: the site path of the game's walkthrough (../games/<id>/walkthrough.json, src/walkthrough). */
  walkthrough?: string;
  /** Original games: its DOS player look, ../games/<id>/player.json ({ base, patches }: src/dosPlayer/catalogPatches.ts). */
  player?: unknown;
  /** Original games: what its keys, joystick buttons, counters and sounds mean, ../games/<id>/controls.json (src/editor/core/gameControls.ts). */
  controls?: unknown;
  /** The build drew its pictures (games/shots/<id>-<cols>x<rows>.png, scripts/gameShots.ts). */
  shots?: boolean;
  /** …and its hero (games/shots/<id>-hero.png). */
  heroShot?: boolean;
  /** Standalone DOS ZIP at a permanent URL, in both Vite development and production. */
  pack?: string;
  /** Built sites: what the home page's quick check finds in it (src/editor/shell/gameHealth.ts), so the page need not fetch files to know. */
  health?: Issue[];
  /** Built sites: the size of its pack in bytes (what downloading it for offline use costs, src/offline). */
  packBytes?: number;
  /** Built sites: its ZIP ships split, as this .zpart file and games/shared/ data (scripts/zipShare.ts); `pack` names the joined ZIP. */
  parts?: string;
  /** Built sites, games with a box: what the box reads from the .gam (src/desk/boxes/boxFacts.ts). */
  boxGame?: BoxGame;
}

/** What ../games/<id>/about.json and manual.json add for an original game. */
export interface OriginalExtras {
  /** Printed disk label: background, band and text colors, and a small logo line. */
  label?: { background: string; band: string; ink: string; logo?: string };
  /** Box art: colors, tagline, back-cover copy, feature bullets and screenshot spots. */
  box?: {
    background: string;
    accent: string;
    ink: string;
    tagline: string;
    back: string;
    features: string[];
    /** Map views for screenshots: [map file, x, y] in blocks. */
    shots?: [string, number, number][];
    rating?: string;
  };
  /** The manual: pages of simple HTML, with <shot map="x.map" x="1" y="2"> screenshots. */
  manual?: { title: string; pages: { head: string; html: string }[] };
  /** The paper extras in the box (games/<id>/printables.json, see src/manual/printables). */
  printables?: PrintablesFile;
  /** 'sb' games use the Sound Blaster; 'speaker' ones only the PC speaker. */
  sound?: 'sb' | 'speaker';
}

/**
 * Who made each game, when, and what registration cost. Sources: each game's own
 * credit/readme screens on the CD, and https://en.wikipedia.org/wiki/Game-Maker.
 * Fields no source states are left out rather than guessed. Old .gam files often name
 * their title scene "Title Screen" or a version number, so titles live here too.
 */
export interface GameInfo {
  title: string;
  author?: string;
  company?: string;
  year?: number;
  /** Registration / price, as the author stated it. */
  price?: string;
}

const RSD = 'Recreational Software Designs';
const AJ = 'A-J Games';
export const GAME_INFO: Record<string, GameInfo> = {
  // gameware (the samples that came with Game-Maker)
  sample: { title: 'Sample', author: 'Joan Stone', company: RSD, year: 1991 },
  pipemare: { title: 'Pipemare', author: 'G. Oliver Stone', company: RSD, year: 1991 },
  nebula: { title: 'Nebula', author: 'Andy Stone', company: RSD, year: 1991 },
  terrain: { title: 'Terrain', company: RSD, year: 1991 },
  houses: { title: 'Houses', company: RSD, year: 1991 },
  penguin: { title: 'Penguin Pete', author: 'Joan Stone', company: RSD, year: 1991 },
  tutor: { title: 'Tutor', company: RSD },
  zark: { title: 'Zark', author: 'Eric-Jon Waugh', company: AJ },
  heart: { title: 'The Patchwork Heart', company: AJ },
  peach: { title: 'Peach the Lobster', company: AJ, year: 1994 },
  glub: { title: 'Glubada Pond', company: AJ },
  donut: { title: 'Crullo: Adventures of a Donut', company: AJ },
  rings5: { title: "Cireneg's Rings", author: 'Eric-Jon Waugh', company: AJ, price: '$10' },
  volume: { title: 'Linear Volume', author: 'Eric-Jon Waugh', company: AJ, year: 1993, price: '$10' },
  outerlim: { title: 'Woman Warrior and the Outer Limits', author: 'Sheldon Chase', company: 'KD Software' },
  warrior: { title: 'Woman Warrior and the Attack from Below', author: 'Sheldon Chase', company: 'KD Software' },
  bcuda: { title: 'Barracuda: Secret Mission 1', company: 'GameLynk', year: 1992 },
  // shareware
  ajquest: { title: "A-J's Quest", author: 'Eric-Jon Waugh', company: AJ, year: 1992, price: '$15' },
  ajqst2: { title: 'Return of A-J (demo)', author: 'Eric-Jon Waugh', company: AJ, year: 1994, price: '$15' },
  bounerm: { title: 'Bounerim', company: AJ, price: '$20' },
  congress: { title: 'Progress or Congress?', author: 'Mark Hadley', year: 1994, price: '$7–$15' },
  fluffyr: { title: 'Fluffy Ralph', company: AJ, price: '$15' },
  gridlin: { title: 'Gridline', author: 'Eric-Jon Waugh', company: AJ, year: 1993, price: '$10' },
  njlnflx: { title: 'Nejilian Flux', company: AJ, price: '$15' },
  octolrs: { title: 'Octolris', company: AJ, year: 1994, price: '$20' },
  orb: { title: 'ORB - The Derelict Planet', author: 'Josh Turcotte', price: '$10 + $1 shipping' },
  pac: { title: 'PAC', company: AJ, price: 'Freeware' },
  paperair: { title: 'Paper Airplane', author: 'Matt Bell', year: 1993, price: '$15' },
  parsec3d: { title: 'Parsec Man 3D', author: 'Mark Hadley', year: 1994, price: '$7–$15' },
  signhdg: { title: 'Sign of the Hedgehog', author: 'Eric-Jon Waugh', company: AJ, price: '$20' },
  zoom: { title: 'Zoom the Super Bear', company: AJ, price: '$20' },
};

export interface GmInstallEntry {
  name: string;
  size: number;
  dir: boolean;
}

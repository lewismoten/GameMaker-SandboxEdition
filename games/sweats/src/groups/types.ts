// What a group of monologues hands the build. A group has one block set (.BBL, up to 150
// blocks after the common ones), one monster block set (.MBL, up to 100 after the common
// sprites), its own palette ramps, and its monologues in the order they are performed; each
// monologue is one scene with its own map, .MON, palette, sound set and title card.
import type { Monster } from '../../../../web/src/formats/monster';
import type { Lighting, Pal, Ramp } from '../art/pal';
import type { BlockBook } from '../common/blocks';
import type { MapBuilder } from '../levels/maps';
import type { SpriteBook } from '../common/sprites';

export interface Monologue {
  /** The scene's file names (8 chars at most): <file>.map, .mon, .pal, .snd, card<n>.fli. */
  file: string;
  /** The monologue's title, as Lewis named it. */
  title: string;
  /** The scene's name in the integrator (25 chars at most). */
  desc: string;
  /** How the scene is lit (undefined: plainly). */
  light?: Lighting;
  /** Lays out the map; returns where the poet starts (scene coordinates). */
  build: (m: MapBuilder) => { start: [number, number]; size: [number, number] };
  /** The filler block outside the scene (solid), and the map's legend. */
  filler: string;
  legend?: Record<string, string>;
  /** Fills monster slots FIRST_GROUP_MON.. of this scene's .MON (the common ones are filled already). */
  monsters: (set: Monster[], mb: SpriteBook) => void;
  /** The scene's song (sound/song.ts). */
  song: string;
  /** The voice clips (sound/clips.ts names): the opening line (the spotlight), B's line, the punch line (the gate), and Space's word. */
  clips: { open: string; line: string; punch: string; word: string };
  /** The title card's view of the map: its top-left block (scene coordinates), 16 x 6 blocks. */
  view: [number, number];
  /** Two lines (up to 26 columns each) from the monologue for its title card. */
  card: [string, string];
}

export interface Group {
  /** The group's id, and its block files: <id>.bbl, <id>.mbl. */
  id: string;
  /** The set's name on the open-mic sign-up sheet. */
  name: string;
  ramps: Ramp[];
  /** Adds the group's background blocks to a book (called once per palette: draw only from `pal`). */
  blocks: (book: BlockBook, pal: Pal) => void;
  /** Adds the group's monster sprites after the common ones. */
  sprites: (book: SpriteBook, pal: Pal) => void;
  monologues: Monologue[];
}

// What comes in the box of a Sandbox Software game besides the disk: the printed manual and
// its paper extras ("printables"). Every game gets a set of generated extras; a game adds its
// own in games/<id>/printables.json (see README.md in this folder for the full guide).

import type { PrintsItem, SpyglassItem } from './sleuthTypes';

/** Extras every game gets, made from its catalog entry, manual and disk files. */
export type GeneratedKind =
  | 'postcard' // registration postcard
  | 'keycard' // quick-reference card of the keys in its .CHR files
  | 'catalog' // Sandbox Software's games
  | 'bbs' // THE -= S A N D B O X =- BBS ad insert
  | 'warranty' // warranty / shareware license card
  | 'newsletter' // The Sandbox Scoop
  | 'hintoffer' // the hint book order slip (only when the game has a hint book)
  | 'stickers' // a sheet of stickers to cut out
  | 'worldmap' // the fold-out World Map: every scene and the ways between them, from the .GAM
  | 'levelmaps'; // Level Maps: every level's real map, cropped, with arrivals and ways out marked

/** A spot on a map, in blocks (0-99), with a label. */
interface MapMark {
  x: number;
  y: number;
  label: string;
  /** 'secret' marks print as a red star; 'start' as a green arrow; anything else a numbered dot. */
  kind?: 'secret' | 'start' | 'goal' | 'shop' | 'note';
}

/** A window onto one of the game's .map files, drawn from the real blocks. */
export interface MapPanel {
  map: string;
  x: number;
  y: number;
  w: number;
  h: number;
  caption?: string;
  marks?: MapMark[];
  /** The map is a course through the wrap: drawn as the run the player rides, in columns (levelCoursePoster.ts), not as the window. */
  course?: boolean;
}

export interface ItemBase {
  /** The name in the "What's in the box" tray. */
  title: string;
  /** True when the manual promises it to registered players (it shows a "Registered" seal). */
  promised?: boolean;
  /** One line under the title in the tray. */
  note?: string;
}

/** A printed map or poster: one or more map windows with marks and a legend. */
export interface MapItem extends ItemBase {
  kind: 'map';
  heading?: string;
  intro?: string;
  /** The first panel spans the sheet; the rest sit `columns` to a row (default 2). */
  panels: MapPanel[];
  columns?: 1 | 2;
  /** Footnotes under the map. */
  legend?: string[];
  landscape?: boolean;
}

/** A hint book. Answers are printed under red noise; read them through the red film. */
export interface HintBookItem extends ItemBase {
  kind: 'hintbook';
  intro?: string;
  /** What the cover shows, when the automatic pick (hintCoverArt.ts) is poor. */
  cover?: HintCover;
  sections: { head: string; hints: { q: string; a: string; sketch?: HintSketch }[] }[];
}

/**
 * A hint book cover's art. `hero`: a character file (its scene's blocks and palette are
 * found), or the three files. `scene`: "title" (the title screen), a GIF of the game's, or a
 * map window [map, x, y] (16 x 10 blocks). Colors are CSS colors; the box's are the default.
 */
export interface HintCover {
  hero?: string | Portrait;
  scene?: string | [map: string, x: number, y: number];
  background?: string;
  accent?: string;
}

/**
 * A little drawing printed under the red film below a hint's answer: `rows` of cells, one
 * character each (see SKETCH_GLYPHS in redFilm.ts: # wall, = brick, : faint seam, X the
 * spot, @ you, T tree, o round thing, ~ water, . path, > < v ^ arrows, - | lines, space
 * nothing), and `labels` written in at a cell (x across, y down).
 */
export interface HintSketch {
  rows: string[];
  labels?: { x: number; y: number; text: string }[];
}

/** A typed or handwritten letter. body is simple HTML (<p>, <b>, <i>). */
export interface LetterItem extends ItemBase {
  kind: 'letter';
  letterhead?: string;
  /** Second line of the letterhead (an address in the game's world). */
  address?: string;
  date?: string;
  to?: string;
  body: string;
  signature: string;
  /** 'type' (typewriter), 'hand' (handwriting) or 'print' (laser printer, the default). */
  style?: 'type' | 'hand' | 'print';
}

/** A newspaper front page from the game's world. */
export interface NewspaperItem extends ItemBase {
  kind: 'newspaper';
  masthead: string;
  date: string;
  price?: string;
  headline: string;
  deck?: string;
  /** Simple HTML, one entry per column. */
  columns: string[];
  /** An optional photo: a window onto a map. */
  photo?: MapPanel;
  /** Small stories along the bottom: [headline, text]. */
  briefs?: [string, string][];
}

/** Diary or ledger pages. */
export interface JournalItem extends ItemBase {
  kind: 'journal';
  heading?: string;
  entries: { date: string; html: string }[];
}

/** The hero from a .CHR file: the first frame of a sequence (0 = standing). */
export interface Portrait {
  chr: string;
  cbl: string;
  pal: string;
  seq?: number;
}

/** An ID card, license or membership card from the game's world. */
export interface IdCardItem extends ItemBase {
  kind: 'idcard';
  org: string;
  name: string;
  role: string;
  fields: [string, string][];
  /** Card color and ink. */
  color?: string;
  ink?: string;
  /** Photo: a map window centered on the hero (2x2 blocks works well). */
  photo?: MapPanel;
  /** Or the hero himself, from his character file (drawn over `photo` if both are given). */
  portrait?: Portrait;
  /** Text on the back of the card. */
  back?: string;
}

/** Tables on paper: a chart, a price list, a world list. */
export interface ChartItem extends ItemBase {
  kind: 'chart';
  heading?: string;
  intro?: string;
  tables: { head: string; note?: string; columns: string[]; rows: string[][] }[];
}

/** A fold-out star chart: a hub, sectors around it, worlds in each sector. */
export interface StarChartItem extends ItemBase {
  kind: 'starchart';
  heading: string;
  hub: { name: string; note?: string };
  sectors: {
    name: string;
    /** What opens the sector (e.g. "Ruby + Amber"). */
    gate?: string;
    color?: string;
    worlds: { name: string; kind?: string; holds?: string }[];
  }[];
  /** Extra notes in the margin. */
  notes?: string[];
  /** A map window printed as an inset ("as seen from the pod"). */
  inset?: MapPanel;
}

/**
 * A recipe card: a ruled index card in a cook's hand, its lines numbered (a footnote mark
 * where a line has a note), the notes on the back, an optional rubber stamp across the front.
 * `blank` lines print as a numbered rule with nothing on it.
 */
export interface RecipeItem extends ItemBase {
  kind: 'recipe';
  heading: string;
  serves?: string;
  lines: { n: number; name: string; line: string; note?: string }[];
  blank?: number[];
  stamp?: string;
  /** A last line on the back, under the notes. */
  back?: string;
}

/**
 * A paper code wheel (codeWheel.ts): an outer disc with a ring of symbols, and a smaller disc pinned over it
 * that turns, with a ring of its own facing the outer one and windows cut through it onto a ring printed on
 * the outer disc underneath. It decodes the game's lettering (runes, an alien script, symbols) and answers its
 * puzzles; printed, it is two discs to cut out and pin together; on screen it turns.
 */
export interface CodeWheelItem extends ItemBase {
  kind: 'codewheel';
  /** Round the outer disc's rim. */
  heading: string;
  /** In the middle of the turning disc. */
  center?: string;
  /** A picture on the turning disc's hub: 'nose' is "CLOWN CLUB" round a red rubber nose (the center text is then left out). */
  emblem?: 'nose';
  /** Colors for glyphs: a glyph's name and 12 rows of letters over its picture (`fillColors` has the colors; a capital also covers ink). */
  fills?: Record<string, string[]>;
  /** A letter's color, for `fills`. */
  fillColors?: Record<string, string>;
  /** The outer disc's ring, clockwise from the top: letters, words, or glyph names (`glyphs`). */
  outer: string[];
  /** The turning disc's ring, as many as `outer`, each facing one of them. */
  inner: string[];
  /**
   * A third disc between the two, turning on its own, with a ring of its own (as many as `outer`); the hidden
   * rings are then printed on it, under the small disc's windows.
   */
  middle?: string[];
  /**
   * Split pictures: the big disc's ring holds the top half of each picture in `glyphs` and the next disc's ring
   * (the middle one, or else the small one) the bottom half, drawn flush to the edge they share, so the halves of
   * a picture join into one when the same name lines up.
   */
  split?: boolean;
  /**
   * Rings on the outer disc under the turning one, seen only through its windows (each as many as `outer`): one
   * ring, or several, outermost first, each at its own distance from the pin so each window shows its own.
   */
  hidden?: string[] | string[][];
  /**
   * Three-disc wheels: a cell of a hidden ring that is '' is a hole cut through the middle disc, so the window
   * above it looks straight through to the big disc. `behind` holds the rings printed there, on the big disc
   * (one per hidden ring, each as many as `outer`), seen only through a window over a hole.
   */
  behind?: string[][];
  /** Windows cut through the turning disc: the place in its ring each is beside, its label, and the hidden ring it opens on (0 by default). */
  windows?: { at: number; label?: string; ring?: number }[];
  /** Pictures for symbols: a name, and rows of '#' (ink) and '.' (paper), every row as wide. */
  glyphs?: Record<string, string[]>;
  /** How to use it, printed with the discs and shown beside the wheel on screen. */
  howto?: string[];
  /**
   * The puzzles it solves: the scenes they are on (the 1994 desk lays the wheel beside the monitor there), the
   * question, and the setting (the turning disc's `inner` symbol and the outer disc's `outer` one, and on a
   * three-disc wheel the middle disc's `middle` one, together under the arrow). The answer is what the wheel shows then: the symbol in window `window` (an index into `windows`), or, with `windowsRead`, the symbols in those windows read in order,
   * or, for decoding a word, a short `answer`.
   */
  puzzles?: {
    scenes: number[];
    ask: string;
    turn: { inner: string; outer: string; middle?: string };
    window?: number;
    windowsRead?: number[];
    answer?: string;
  }[];
}

/**
 * A look-up code sheet (codeSheet.ts): a card printed black on dark red (or light cyan), the old paper a
 * photocopier turns to mud, with one or more grids of squares read by row and column (a place and a number, a
 * name and a letter). It answers the game's puzzles; printed, it is one letter sheet; on screen a click lights a
 * square's row and column, and each puzzle has a "Tell me the answer" that lights its square.
 */
export interface CodeSheetItem extends ItemBase {
  kind: 'codesheet';
  /** Across the top of the card. */
  heading: string;
  /** The card's color: dark red (the default) or light cyan. */
  paper?: 'red' | 'cyan';
  /** Lines under the heading: how to read it. */
  howto?: string[];
  /** The grids: a title, the row and column headings, and a square for every row and column (`cells[row][col]`). */
  grids: { title: string; rowHead?: string; colHead?: string; rows: string[]; cols: string[]; cells: string[][] }[];
  /** Pictures for squares and headings: a name, and rows of '#' (ink) and '.' (paper), every row as wide. */
  glyphs?: Record<string, string[]>;
  /** A last line along the bottom. */
  foot?: string;
  /**
   * The puzzles it solves: the scenes they are on (the 1994 desk lays the sheet beside the monitor there), the
   * question, and the square that answers it (grid index, row and column headings), with a short `answer` to say.
   */
  puzzles?: { scenes: number[]; ask: string; grid: number; row: string; col: string; answer?: string }[];
}

/**
 * A postcard and a grille card (postcardGrille.ts, math in postcardMath.ts): a postcard whose message is a grid of
 * ordinary words with small pictures printed along its border, and a card with a few numbered holes to lay over it.
 * Two marks on the grille's edges each look along their row or column out to the border; where both meet their own
 * picture, the holes read the code. Printed: the card's two sides and the grille's two faces (cut out and glue);
 * on screen the grille is dragged, turned and flipped over the card.
 */
export interface PostcardGrilleItem extends ItemBase {
  kind: 'postcardgrille';
  /** Across the picture side, and the line under it. */
  heading: string;
  caption: string;
  /** The address lines on the right of the message side (obviously fake). */
  address?: string[];
  /** The message: lines of cells (a multiple of three across); a word sits in its first cell, the cells it spills over are ''. */
  rows: string[][];
  border: import('./postcardMath').Border;
  grille: import('./postcardMath').Grille;
  /** Pictures for the border and the marks: a name, and rows of '#' (ink) and '.' (paper), every row as wide. */
  glyphs: Record<string, string[]>;
  howto?: string[];
  /** The puzzles: the scenes they are on, the question, the placement that answers it and what it reads. */
  puzzles?: { scenes: number[]; ask: string; place: import('./postcardMath').Place; answer?: string }[];
}

export type PrintableItem =
  | SpyglassItem
  | PrintsItem
  | MapItem
  | HintBookItem
  | LetterItem
  | NewspaperItem
  | JournalItem
  | IdCardItem
  | ChartItem
  | StarChartItem
  | RecipeItem
  | CodeWheelItem
  | CodeSheetItem
  | PostcardGrilleItem;

/** A sticker on the sticker sheet. */
export interface StickerSpec {
  text: string;
  /** Small text under the main text. */
  sub?: string;
  /**
   * circle, rect, star (a seal), badge, heart, burst (a comic-book bang), bubble (a speech
   * balloon), or cut: cut out round the picture's own outline, its words on a plate under it.
   */
  shape?: 'circle' | 'rect' | 'star' | 'badge' | 'heart' | 'burst' | 'bubble' | 'cut';
  color?: string;
  ink?: string;
  /** A picture from a map (a few blocks). */
  shot?: MapPanel;
  /** A monster or thing drawn from the game's own block file. */
  sprite?: SpriteArt;
  /** A character from his .CHR file, standing (drawn instead of `sprite`). */
  hero?: Portrait;
  /** A picture drawn in code, not from the game's files: Lady Regina's tiara, in silver (stickerDrawn.ts). */
  drawn?: 'tiara';
  /** What changes once the rubber chicken is Lady Regina (chicken/chickenState.ts): this sticker's fields, replaced. */
  lady?: Partial<StickerSpec>;
  /** A die-cut's size: each pixel of its picture prints this many 1/150 inch (default: about 1.3" tall). */
  px?: number;
  /** Leave it out of the little cut-outs that fill the sheet's gaps. */
  noMini?: boolean;
}

/** Blocks from a .mbl, .cbl or .bbl file laid out in a grid: rows of block numbers (-1 = empty). */
export interface SpriteArt {
  blocks: string;
  pal: string;
  grid: number[][];
  /** Only this part of the picture, in pixels: [x, y, width, height] (Doc Leo's hat from his front block). */
  crop?: [number, number, number, number];
  /**
   * The plain ground block a background thing is drawn on (or a grid of them, like `grid`): its
   * pixels round the thing are cut away. "edge" cuts away the colors along the picture's edge instead
   * (for a thing on speckled ground).
   */
  under?: number | number[][] | 'edge';
  /** Facing the other way. */
  flip?: boolean;
}

/** A story for The Sandbox Scoop newsletter. */
interface NewsStory {
  head: string;
  html: string;
  /** Also run it in the other games' newsletters (it doesn't talk about this box). */
  everywhere?: boolean;
}

/**
 * How the player's World Map groups scenes into places. Each group's first scene is the place;
 * the rest are folded into it (no picture of their own) and listed on its land. A scene is a
 * number, a range ("9-18"), or a name only one scene has. Scenes shown under an all-black
 * palette fold into their place without being named here (worldMapGroups.ts).
 */
export interface WorldMapHints {
  groups?: {
    scenes: (number | string)[];
    /** The place's name on the map (default: its scene's). */
    name?: string;
    /** What its land lists (default: the folded scenes' numbers and names). */
    labels?: string[];
  }[];
  /**
   * The game's regions, drawn as one land each (scene numbers, "9-18" or names), instead of the ones
   * worldMapRegions.ts finds. Palette files that are the same are one file in a built game, so what
   * a level's own palette once told is not in the disk: a game says where its levels are here.
   */
  regions?: (number | string)[][];
}

/** games/<id>/printables.json */
export interface PrintablesFile {
  /** Generated extras this game does without. */
  skip?: GeneratedKind[];
  /** The game's own extras, in tray order (after the manual). */
  items?: PrintableItem[];
  /** Key card wording, by key as Game-Maker names it ("Space", "Z", "Up", "F2"). */
  keys?: Record<string, string>;
  /** Stickers added to the sticker sheet. */
  stickers?: StickerSpec[];
  /** Stories this game adds to The Sandbox Scoop. */
  news?: NewsStory[];
  /** A one-line pitch for the publisher catalog (defaults to the blurb). */
  pitch?: string;
  /** The World Map's places (see WorldMapHints). */
  worldMap?: WorldMapHints;
}

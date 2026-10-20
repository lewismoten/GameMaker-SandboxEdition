// What comes in the box of a Sandbox Software game besides the disk: the printed manual and
// its paper extras ("printables"). Every game gets a set of generated extras; a game adds its
// own in games/<id>/printables.json (see README.md in this folder for the full guide).

/** Extras every game gets, made from its catalog entry, manual and disk files. */
export type GeneratedKind =
  | 'postcard' // registration postcard
  | 'keycard' // quick-reference card of the keys in its .CHR files
  | 'catalog' // Sandbox Software's games
  | 'bbs' // THE -= S A N D B O X =- BBS ad insert
  | 'warranty' // warranty / shareware license card
  | 'newsletter' // The Sandbox Scoop
  | 'hintoffer' // the hint book order slip (only when the game has a hint book)
  | 'stickers'; // a sheet of stickers to cut out

/** A spot on a map, in blocks (0-99), with a label. */
export interface MapMark {
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
}

interface ItemBase {
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
  sections: { head: string; hints: { q: string; a: string }[] }[];
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

export type PrintableItem = MapItem | HintBookItem | LetterItem | NewspaperItem | JournalItem | IdCardItem | ChartItem | StarChartItem;

/** A sticker on the sticker sheet. */
export interface StickerSpec {
  text: string;
  /** Small text under the main text. */
  sub?: string;
  shape?: 'circle' | 'rect' | 'star' | 'badge';
  color?: string;
  ink?: string;
  /** A picture from a map (a few blocks). */
  shot?: MapPanel;
}

/** A story for The Sandbox Scoop newsletter. */
export interface NewsStory {
  head: string;
  html: string;
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
}

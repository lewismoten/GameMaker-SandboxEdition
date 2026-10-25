// TURBO BUTTON, the site's 1990s game magazine: what its pages are made of. A section is a
// module returning pages; a page is a list of blocks; text is a string with a tiny markup.
// All of it is plain data (no DOM), so tests read the whole issue in Node; render.ts draws it.
import type { Go } from './go';

/** The paper a page is printed on. */
export type Tone = 'white' | 'news' | 'pink' | 'yellow' | 'cyan' | 'black';

/**
 * Inline text: a string with `**bold**`, `*italic*` and `[label](go:target)` links (inline.ts).
 * THE CHEZ never breaks across lines (the renderer keeps it together).
 */
export type Inline = string;

/** A game as the magazine lists it (games.ts magGames; never a secret one). */
export interface MagGame {
  id: string;
  title: string;
  /** sandbox: Sandbox Software's; bizarre: The Bard of Bizarre's song-games; then the CD's. */
  kind: 'sandbox' | 'bizarre' | 'gameware' | 'shareware';
  author?: string;
  company?: string;
  year?: number;
  price?: string;
  blurb?: string;
  /** It has a manual box (and so a newsletter and catalog in it). */
  manual: boolean;
  /** Its hint book's own title, e.g. 'The Royal Hint Book'. */
  hintBook?: string;
  /** Its box has a hint book: the hint book's questions, by section. */
  hints?: { head: string; hints: { q: string; a: string }[] }[];
  /** Box tagline and features, for the Sandbox games. */
  tagline?: string;
  features?: string[];
  /** The headlines of its own stories in its box's newsletter, The Sandbox Scoop. */
  news?: string[];
}

/** One game in a listing (`rows` block). */
export interface ListingRow {
  title: string;
  /** Where the title links (go:play/<id> mostly). */
  go?: Go;
  by?: string;
  kind?: string;
  price?: string;
  blurb?: Inline;
  /** A small extra link, e.g. ['Hint book', 'go:hints/teddy']. */
  more?: [label: string, go: Go][];
  /** A small screenshot at the row's left, drawn from that listed game (like a `shot` block). */
  shot?: { game: string; view: 'title' | 'level'; alt: string };
}

export type Block =
  | { t: 'head'; text: string; kicker?: string; deck?: Inline; size?: 'xl' | 'l' | 'm' | 's'; level?: 1 | 2 | 3 }
  | { t: 'p'; text: Inline; drop?: boolean; lead?: boolean }
  | { t: 'qa'; who?: string; text: Inline }
  | { t: 'list'; items: Inline[]; ordered?: boolean }
  | { t: 'cols'; n: 2 | 3; blocks: Block[] }
  | { t: 'grid'; cells: Block[][]; min?: number }
  | { t: 'side'; title: string; tone?: Tone; blocks: Block[]; level?: 2 | 3 }
  | { t: 'pull'; text: Inline; by?: string }
  /** A screenshot; `float` sets it beside the text that follows it in its cell, which wraps around it. */
  | { t: 'shot'; game: string; view: ShotView; alt: string; caption?: Inline; tilt?: number; float?: 'left' | 'right' }
  | { t: 'art'; art: ArtId; alt: string; caption?: Inline }
  /** A cast member's portrait: public/cast/<id>.png (cast/castData.ts), drawn from a game's own files. */
  | { t: 'cast'; id: string; alt: string; w: number; h: number; caption?: Inline }
  | { t: 'rows'; rows: ListingRow[] }
  | { t: 'hint'; game?: string; q: Inline; a: string }
  | { t: 'card'; title: string; lines: Inline[]; fields?: string[]; go?: Go; button?: string; tone?: Tone }
  | { t: 'adframe'; burst?: string; head: string; sub?: Inline; blocks: Block[]; small?: Inline; tone?: Tone }
  | { t: 'button'; go: Go; label: string }
  | { t: 'note'; text: Inline }
  | { t: 'masthead'; name: string; tagline: string; issue: string; price: string }
  /** A box's printed piece: a game's hint book cover, or The Ultimate Owner's Guide's (no game). */
  | { t: 'piece'; game?: string; piece: 'hintbook' | 'ultimate'; alt: string; go?: Go; float?: 'left' | 'right' }
  /** A line set huge, not a heading: an ad's price or phone number, with a small note beside it. */
  | { t: 'big'; text: string; side?: Inline }
  /**
   * The issue's cover-mounted CD (disc.ts), turning slowly, a link to `go` named by `alt`. On the
   * cover it sits in a corner with a starburst (`burst`) that links to `page`, the page about it.
   */
  | { t: 'disc'; go: Go; alt: string; caption?: Inline; cover?: { burst: string; page: Go } }
  /** A picture with numbered spots on it and a key to them below (callouts.ts): an ad's tour of a product. */
  | { t: 'callouts'; art: ArtId; alt: string; spots: Callout[] }
  /** Back issues and ones to come, fanned out small (coverFan.ts): a subscription ad's stack of covers. */
  | { t: 'covers'; alt: string; covers: MiniCover[] }
  /** A reply card's postage side (replyMail.ts): BUSINESS REPLY MAIL, its bars, and who it goes to. */
  | { t: 'reply'; to: string[] }
  /**
   * A row of mugs (mugShelf.ts), each with one of the desk mug's pictures (desk/mug/mugArt.ts
   * MUG_DESIGNS, by its id) and what that picture is, for its alt text.
   */
  | { t: 'mugs'; mugs: { design: string; name: string }[] }
  /**
   * A shelf of titles (shelf.ts): a long alphabetical list set small in columns, under a letter
   * for each run of titles, with who made each and when; `mark` titles get a check and `markText`.
   */
  | { t: 'shelf'; items: ShelfItem[]; markText: string }
  /**
   * Where a jumped article stops or picks up, as magazines split a long story: `on` ends its page
   * with "Continued on page N ▸", `from` starts the rest at the back of the book with the story's
   * headline again and "▸ Continued from page N". `page` is the other end's page id; issue.ts
   * fills in `folio`, its number, once every page has one (pageRefs.ts).
   */
  | { t: 'jump'; dir: 'on' | 'from'; page: string; title?: string; folio?: number }
  | HalfAd
  /** Editorial in two thirds of the page, and a small ad standing up the last third. */
  | { t: 'beside'; blocks: Block[]; ad: HalfAd }
  | { t: 'rule' };

/**
 * A small ad sharing an editorial page (half of it, or a third in a `beside`), framed and
 * labelled ADVERTISEMENT; listed in the advertiser index under `advertiser`.
 */
export interface HalfAd {
  t: 'halfad';
  advertiser: string;
  head: string;
  sub?: Inline;
  blocks: Block[];
  small?: Inline;
  tone?: Tone;
  burst?: string;
}

/** One title on a `shelf`. */
export interface ShelfItem {
  title: string;
  by?: string;
  year?: number;
  mark?: boolean;
}

/** One numbered spot on a `callouts` picture: where (percent of its width and height) and what it is. */
export interface Callout {
  x: number;
  y: number;
  title: string;
  text: Inline;
}

/** One small cover in a `covers` fan: its issue line, its big cover line, and its paper. */
export interface MiniCover {
  issue: string;
  line: string;
  tone: Tone;
}

/**
 * What a `shot` shows of a game: its title screen, its first level, or one of Game-Maker's design
 * tools at work on that level's files (toolShots.ts): the palette, the block editor, the
 * monsters' animation frames, or the whole map.
 */
export type ShotView = 'title' | 'level' | 'palette' | 'blocks' | 'monsters' | 'map';

/** Screenshots of today's web (webShots.ts): public/magazine/web-<name>.webp. */
export const WEB_SHOTS = ['games', 'map', 'blocks', 'character', 'monster', 'music', 'scene'] as const;
export type WebShot = (typeof WEB_SHOTS)[number];

/**
 * Pictures drawn for the magazine (art.ts), and the photos of the desk and of today's web.
 * The boaster ones are the Sound Boaster ad's (soundCardArt.ts): its card, and a face before and after.
 * The notch ones are the HOLE-Y MOLEY ad's (notcherArt.ts): the press, and a disk's back before and after.
 * joey is a reader's crayon drawing in the Mail Bag (joeyDrawing.ts).
 * blankdisk is a stack of bulk disks with no labels, for the Floppy Barn ad (blankDisk.ts).
 * dos-carl is Lewis's DOSBox screenshot of A Fly Named Carl's garbled cover (dosShot.ts).
 */
export type ArtId =
  | 'chez'
  | 'sandbox'
  | 'barcode'
  | 'disk'
  | 'blankdisk'
  | 'modem'
  | 'speakers'
  | 'diskbox'
  | 'desk'
  | 'gamepad'
  | 'boaster'
  | 'boaster-before'
  | 'boaster-after'
  | 'notcher'
  | 'notch-before'
  | 'notch-after'
  | 'joey'
  | 'dos-carl'
  | `web-${WebShot}`;

export interface MagPage {
  /** For go:mag/<id> links; a section's first page gets the section's id. */
  id?: string;
  kind: 'cover' | 'contents' | 'article' | 'dept' | 'ad' | 'back';
  /** An ad's advertiser (the advertiser index), or the page's own line on the contents page. */
  title?: string;
  /** Running head; else the section's dept. Ads, covers and the contents page have none. */
  head?: string;
  tone?: Tone;
  /** A page laid out in another style: 'classic', the 1992 Game-Maker ad's (hot pink, condensed serif). */
  look?: 'classic';
  blocks: Block[];
}

export interface MagContext {
  /** Every game the magazine may list: never a secret one (games.ts). */
  games: MagGame[];
  game(id: string): MagGame | undefined;
}

export interface MagSection {
  id: string;
  /** Its line on the contents page. */
  title: string;
  /** The small line under it there. */
  blurb?: string;
  /** Running head on its pages; the title by default. */
  dept?: string;
  /** false: not on the contents page (the cover, the contents page, ads: ads go in the advertiser index). */
  toc?: false;
  pages(ctx: MagContext): MagPage[] | Promise<MagPage[]>;
}

/** A page placed in the issue: its folio (page number, from 1) and section. */
export interface PlacedPage extends MagPage {
  /** Every placed page has one: its own, its section's (first page), or <section>-<n>. */
  id: string;
  folio: number;
  section: string;
}

export interface TocEntry {
  section: string;
  /** The page's id, for go:mag/<id>. */
  page: string;
  title: string;
  blurb?: string;
  folio: number;
}

export interface Issue {
  pages: PlacedPage[];
  toc: TocEntry[];
  /** The advertisers, in page order. */
  ads: TocEntry[];
}

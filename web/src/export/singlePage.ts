// The "one web page" export: a single .html file holding the whole player (engine, OPL
// music worklet, styles) and every game file, so it plays straight from disk (file://),
// offline, with nothing else beside it.
//
// The game's files travel in a JSON <script> tag: one blob of all the files end to end,
// gzip-compressed when the browser can, then base64. The player page is a template built
// with the app (standalone.html); the exporter fills in the title, the game, and the tags
// and text that say what the game is and what made it (pageSeo.ts).
import { exportAbout, exportHead, type ExportMeta } from './pageSeo';

/** What the page's <script type="application/json" id="gm-game"> holds. */
export interface SinglePageGame {
  v: 1;
  /** Save data (high scores, saved games) is kept under this key. */
  id: string;
  title: string;
  gam: string;
  /** How `data` is packed: 'gzip' (CompressionStream) or 'raw'. */
  enc: 'gzip' | 'raw';
  /** File names and byte lengths, in the order their bytes appear in the blob. */
  files: [string, number][];
  /** base64 of the (possibly compressed) blob. */
  data: string;
  /** Shareware: the author's notice, linked from the start screen. */
  notice?: string;
}

/** What the exporter knows about the game, for the page's tags and text (see pageSeo.ts). */
export type PageInfo = Omit<ExportMeta, 'title' | 'notice'>;

export const TITLE_MARK = '<!--GM:TITLE-->';
export const GAME_MARK = '<!--GM:GAME-->';
export const GAME_ELEMENT_ID = 'gm-game';
/** Description / Open Graph / JSON-LD tags go here, in the <head>. */
export const HEAD_MARK = '<!--GM:HEAD-->';
/** Readable text about the game (crawlers, no JavaScript) goes here, inside #player. */
export const ABOUT_MARK = '<!--GM:ABOUT-->';
/** The bare template is not a page to index; filled pages lose this tag. */
export const TEMPLATE_ONLY = '<meta name="robots" content="noindex" data-gm-template />';

export function pack(entries: [string, Uint8Array][]): { files: [string, number][]; blob: Uint8Array } {
  const total = entries.reduce((n, [, b]) => n + b.length, 0);
  const blob = new Uint8Array(total);
  let at = 0;
  for (const [, b] of entries) {
    blob.set(b, at);
    at += b.length;
  }
  return { files: entries.map(([n, b]) => [n, b.length]), blob };
}

export function unpack(files: [string, number][], blob: Uint8Array): [string, Uint8Array][] {
  const out: [string, Uint8Array][] = [];
  let at = 0;
  for (const [name, length] of files) {
    if (at + length > blob.length) throw new Error(`The page's game data is cut short (at ${name}).`);
    out.push([name, blob.slice(at, at + length)]);
    at += length;
  }
  return out;
}

export function toBase64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

export function fromBase64(text: string): Uint8Array {
  const s = atob(text);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

async function transform(data: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const piped = new Blob([data as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(piped).arrayBuffer());
}

export async function encodeGame(meta: { id: string; title: string; gam: string; notice?: string }, entries: [string, Uint8Array][]): Promise<SinglePageGame> {
  const { files, blob } = pack(entries);
  const gzip = typeof CompressionStream !== 'undefined';
  const data = gzip ? await transform(blob, new CompressionStream('gzip')) : blob;
  const { notice, ...rest } = meta;
  return { v: 1, ...rest, enc: gzip ? 'gzip' : 'raw', files, data: toBase64(data), ...(notice ? { notice } : {}) };
}

export async function decodeGame(game: SinglePageGame): Promise<[string, Uint8Array][]> {
  let blob = fromBase64(game.data);
  if (game.enc === 'gzip') {
    if (typeof DecompressionStream === 'undefined') throw new Error('This browser is too old to open the game (no DecompressionStream).');
    blob = await transform(blob, new DecompressionStream('gzip'));
  }
  return unpack(game.files, blob);
}

const escapeHtml = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

/** JSON that is safe inside a <script> element (no "</script>", no "<!--"). */
export function scriptJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

/**
 * Fills the built template with the game, its tags and its text (templates from before
 * the head/about slots just get the game). split/join keeps "$" in the data literal.
 */
export function fillPage(template: string, game: SinglePageGame, info: PageInfo = {}): string {
  if (!template.includes(GAME_MARK)) throw new Error('The one-page player template is missing its game slot.');
  const data = `<script type="application/json" id="${GAME_ELEMENT_ID}">${scriptJson(game)}</script>`;
  const meta: ExportMeta = { ...info, title: game.title, notice: game.notice };
  return template
    .split(TEMPLATE_ONLY)
    .join('')
    .split(HEAD_MARK)
    .join(exportHead(meta))
    .split(ABOUT_MARK)
    .join(exportAbout(meta))
    .split(TITLE_MARK)
    .join(escapeHtml(game.title))
    .split(GAME_MARK)
    .join(data);
}

/**
 * The game inside a page made by "Export as one web page" (or an exported web app's
 * index.html), or undefined when the HTML holds none.
 */
export function readSinglePage(html: string): SinglePageGame | undefined {
  const open = html.match(new RegExp(`<script[^>]*\\bid=["']?${GAME_ELEMENT_ID}["']?[^>]*>`, 'i'));
  if (!open || open.index === undefined) return undefined;
  const start = open.index + open[0].length;
  const end = html.indexOf('</script>', start);
  if (end < 0) return undefined;
  let game: SinglePageGame;
  try {
    game = JSON.parse(html.slice(start, end)) as SinglePageGame;
  } catch {
    throw new Error('The game inside this web page is damaged (its data is not valid JSON).');
  }
  if (!game || game.v !== 1 || !Array.isArray(game.files) || typeof game.data !== 'string')
    throw new Error('This web page holds a game in a format this version cannot read.');
  return game;
}

/** Does this look like an HTML page holding a Game-Maker game? (cheap check before reading it all) */
export function isSinglePageName(name: string): boolean {
  return /\.html?$/i.test(name);
}

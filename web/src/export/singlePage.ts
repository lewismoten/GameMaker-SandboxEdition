// The "one web page" export: a single .html file holding the whole player (engine, OPL
// music worklet, styles) and every game file, so it plays straight from disk (file://),
// offline, with nothing else beside it.
//
// The game's files travel in a JSON <script> tag: one blob of all the files end to end,
// gzip-compressed when the browser can, then base64. The player page is a template built
// with the app (standalone.html); the exporter fills in the title, the game, and the tags
// and text that say what the game is and what made it (pageSeo.ts).
import type { PlayerAbout } from '@lewismoten/gamemaker-sandbox-engine/engine/playerLook';
import { exportAbout, exportHead, type ExportMeta } from './pageSeo';
import { readExternalHtml } from './insideRead';
import type { External } from './insideGame';

/** What the page's <script type="application/json" id="gm-game"> holds. */
export interface SinglePageGame {
  /** 1, or 2 when some files are kept in the page itself (`ext`), which a version 1 reader would miss. */
  v: 1 | 2;
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
  /** The project's DOS player customizations (dosPlayer/patchTable.ts ids), so the page plays as its DOS export looks. */
  player?: Record<string, unknown>;
  /** Files kept as page content instead of in `data`: [name, element id, byte length] (insideGame.ts). */
  ext?: External[];
  /** Read from those elements by readSinglePage (not part of the record). */
  external?: Map<string, Uint8Array>;
  /** An imported game's own About text and first build (F10), only those lines, never the companion. */
  playerAbout?: PlayerAbout;
}

/** What the exporter knows about the game, for the page's tags and text (see pageSeo.ts). */
type PageInfo = Omit<ExportMeta, 'title' | 'notice'>;

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

/** The files of a record: those in the blob, then those kept in the page (`external`, element id -> bytes). */
function withExternal(blobFiles: [string, Uint8Array][], ext: External[] | undefined, external: Map<string, Uint8Array> | undefined): [string, Uint8Array][] {
  const out = [...blobFiles];
  for (const [name, id, length] of ext ?? []) {
    const bytes = external?.get(id);
    if (!bytes || bytes.length !== length)
      throw new Error(`The page is missing one of the game's files (${name}); the picture or text it was kept in was changed.`);
    out.push([name, bytes]);
  }
  return out;
}

interface DecodeLimits {
  maxFiles: number;
  maxBytes: number;
}
const DECODE_LIMITS: DecodeLimits = { maxFiles: 2000, maxBytes: 200 * 1024 * 1024 };

function manifestSize(files: [string, number][], ext: External[] = [], limits = DECODE_LIMITS): number {
  if (!Array.isArray(files) || !Array.isArray(ext) || files.length + ext.length > limits.maxFiles) throw new Error('Too many files in the page');
  let total = 0;
  for (const entry of files) {
    if (!Array.isArray(entry) || entry.length !== 2 || typeof entry[0] !== 'string' || !Number.isSafeInteger(entry[1]) || entry[1] < 0)
      throw new Error('Invalid page file length');
    total += entry[1];
    if (total > limits.maxBytes) throw new Error('The page game is too large');
  }
  let all = total;
  for (const entry of ext) {
    if (
      !Array.isArray(entry) ||
      entry.length !== 3 ||
      typeof entry[0] !== 'string' ||
      typeof entry[1] !== 'string' ||
      !Number.isSafeInteger(entry[2]) ||
      entry[2] < 0
    )
      throw new Error('Invalid external file length');
    all += entry[2];
    if (all > limits.maxBytes) throw new Error('The page game is too large');
  }
  return total;
}

export function unpack(files: [string, number][], blob: Uint8Array): [string, Uint8Array][] {
  const expected = manifestSize(files);
  if (blob.length > expected) throw new Error('The page game has trailing data.');
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

async function transform(data: Uint8Array, stream: CompressionStream | DecompressionStream, maxBytes = Infinity): Promise<Uint8Array> {
  const reader = new Blob([data as BlobPart]).stream().pipeThrough(stream).getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > maxBytes) throw new Error('The page game expands beyond its declared size.');
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
  const out = new Uint8Array(total);
  let at = 0;
  for (const chunk of chunks) {
    out.set(chunk, at);
    at += chunk.length;
  }
  return out;
}

export async function encodeGame(
  meta: { id: string; title: string; gam: string; notice?: string; player?: Record<string, unknown>; playerAbout?: PlayerAbout },
  allEntries: [string, Uint8Array][],
  ext: External[] = [],
): Promise<SinglePageGame> {
  const kept = new Set(ext.map(([name]) => name));
  const entries = allEntries.filter(([name]) => !kept.has(name));
  const { files, blob } = pack(entries);
  const gzip = typeof CompressionStream !== 'undefined';
  const data = gzip ? await transform(blob, new CompressionStream('gzip')) : blob;
  const { notice, ...rest } = meta;
  return {
    v: ext.length ? 2 : 1,
    ...rest,
    enc: gzip ? 'gzip' : 'raw',
    files,
    data: toBase64(data),
    ...(ext.length ? { ext } : {}),
    ...(notice ? { notice } : {}),
  };
}

export async function decodeGame(
  game: SinglePageGame,
  external: Map<string, Uint8Array> | undefined = game.external,
  limits = DECODE_LIMITS,
): Promise<[string, Uint8Array][]> {
  const expected = manifestSize(game.files, game.ext, limits);
  if (game.enc !== 'raw' && game.enc !== 'gzip') throw new Error('Unsupported page encoding');
  if (typeof game.data !== 'string' || game.data.length > Math.ceil((limits.maxBytes + 1024 * 1024) / 3) * 4) throw new Error('The page data is too large');
  let blob = fromBase64(game.data);
  if (game.enc === 'gzip') {
    if (typeof DecompressionStream === 'undefined') throw new Error('This browser is too old to open the game (no DecompressionStream).');
    blob = await transform(blob, new DecompressionStream('gzip'), expected);
  }
  return withExternal(unpack(game.files, blob), game.ext, external);
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
  // `external` is read back from the page, so it never goes into the record
  const { external: _kept, ...record } = game;
  const data = `${info.inside ?? ''}<script type="application/json" id="${GAME_ELEMENT_ID}">${scriptJson(record)}</script>`;
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
  if (!game || (game.v !== 1 && game.v !== 2) || !Array.isArray(game.files) || typeof game.data !== 'string')
    throw new Error('This web page holds a game in a format this version cannot read.');
  manifestSize(game.files, game.ext);
  if (game.ext) game.external = readExternalHtml(html);
  return game;
}

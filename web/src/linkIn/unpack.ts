// A game sent by another site, from its files to a game ready to keep: a .zip of the game's
// folder, a game pack (.gmpak, gzipped or not), a page made by "Export as one web page", or
// the game's own files. Every reader is fenced: damaged or hostile data ends in a LinkError
// with a plain message, never a crash, and the limits (protocol.ts) hold after unpacking too.
// DOS programs (.EXE, .COM, .BAT…) are left out; nothing received is ever run.
import { GameFiles, IGNORED_FILE } from '../project/files';
import { isZip, readZip } from '../project/zip';
import { decodePack } from '../project/gamePack';
import { gameFromPageHtml } from '../project/importPage';
import { parseGame } from '../formats/game';
import { takeCompanion, type Companion } from '../project/companion';
import { LinkError, MAX_FILES, MAX_TOTAL_BYTES, checkLimits, cleanName } from './protocol';

export interface UnpackedGame {
  files: GameFiles;
  gam: string;
  /** The game's title: the sender's name, the exported page's title, or the .gam's own. */
  title: string;
  companion?: Companion;
}

const GZIP = (b: Uint8Array) => b[0] === 0x1f && b[1] === 0x8b;
const PACK = (b: Uint8Array) => b[0] === 0x47 && b[1] === 0x4d && b[2] === 0x50 && b[3] === 0x4b;
const looksHtml = (name: string, b: Uint8Array) =>
  /\.html?$/i.test(name) ||
  /^\s*<(!doctype|html)/i.test(
    String.fromCharCode(...b.subarray(0, 64))
      .replace(/^\uFEFF/, '')
      .replace(/^\xEF\xBB\xBF/, ''),
  );

/** Gunzips at most MAX_TOTAL_BYTES. */
async function gunzip(bytes: Uint8Array): Promise<Uint8Array> {
  const reader = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream('gzip')).getReader();
  const parts: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > MAX_TOTAL_BYTES) {
      await reader.cancel();
      throw new LinkError('The game unpacks to more than the limit allows.', 'too-big');
    }
    parts.push(value);
  }
  const out = new Uint8Array(total);
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

/** One file that holds a whole game (a zip, a pack, an exported page), opened up; undefined when it is just a file. */
async function container(name: string, bytes: Uint8Array): Promise<{ files: [string, Uint8Array][]; title?: string; gam?: string } | undefined> {
  if (isZip(bytes)) {
    const entries = await readZip(bytes, { maxEntries: MAX_FILES, maxBytes: MAX_TOTAL_BYTES }).catch((e: Error) => {
      throw new LinkError(`The .zip file could not be read (${e.message}).`, /more than/.test(e.message) ? 'too-big' : 'invalid');
    });
    return { files: entries.map((e) => [e.name, e.data]) };
  }
  if (/\.gmpak$/i.test(name) || PACK(bytes) || (GZIP(bytes) && !/\.(gam|gif|fli|cmf|voc)$/i.test(name))) {
    const raw = GZIP(bytes)
      ? await gunzip(bytes).catch((e: unknown) => {
          if (e instanceof LinkError) throw e;
          throw new LinkError('The game pack is damaged (it does not unzip).', 'invalid');
        })
      : bytes;
    if (!PACK(raw)) return undefined;
    try {
      return { files: decodePack(raw) };
    } catch {
      throw new LinkError('The game pack is damaged or cut short.', 'invalid');
    }
  }
  if (looksHtml(name, bytes) && bytes.length <= MAX_TOTAL_BYTES * 2) {
    const page = await gameFromPageHtml(new TextDecoder().decode(bytes)).catch((e: Error) => {
      throw new LinkError(e.message || 'The web page’s game is damaged.', 'invalid');
    });
    if (!page) throw new LinkError('That web page holds no game. Only pages made by “Export as one web page” carry one.', 'no-game');
    return { files: page.files.entries(), title: page.title, gam: page.gam };
  }
  return undefined;
}

/**
 * The game in these files, checked: a .gam that reads, within the limits, with DOS programs
 * left out. `name` is the sender's name for it, `gam` the .gam it says to play.
 */
export async function unpackGame(input: [string, Uint8Array][], opts: { name?: string; gam?: string } = {}): Promise<UnpackedGame> {
  checkLimits(input);
  let list = input;
  let title = opts.name;
  let preferred = opts.gam;
  if (input.length === 1) {
    const inner = await container(input[0][0], input[0][1]);
    if (inner) {
      list = inner.files;
      title ??= cleanName(inner.title);
      preferred ??= inner.gam;
    }
  }
  const files = new GameFiles();
  for (const [n, bytes] of list) if (!n.endsWith('/') && !IGNORED_FILE.test(n)) files.set(n, bytes);
  checkLimits(files.entries());
  let companion: Companion | undefined;
  try {
    companion = takeCompanion(files);
  } catch {
    // a damaged companion (editor-only extras) is left behind; the game itself is fine
    for (const n of files.byExtension('gmx')) files.delete(n);
  }
  const gam = files.mainGame(preferred);
  if (!gam)
    throw new LinkError(
      'No .gam file came with the game, so there is nothing to play. Send the whole game folder, a .zip of it, or a one-page export.',
      'no-game',
    );
  let desc = '';
  try {
    const game = parseGame(files.get(gam)!);
    if (!game.scenes.length) throw new Error('no scenes');
    desc = game.scenes[0]?.desc ?? '';
  } catch {
    throw new LinkError(`${gam.toUpperCase()} is damaged or is not a Game-Maker game file.`, 'invalid');
  }
  return { files, gam, title: cleanName(title) ?? cleanName(desc) ?? gam.replace(/\.gam$/i, '').toUpperCase(), companion };
}

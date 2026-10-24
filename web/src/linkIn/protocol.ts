// Opening a game sent by another site (docs/embed.md): the addresses that ask for one, the
// messages of the window.open + postMessage handshake, and the limits. No DOM here, so it is
// tested on its own (protocol.test.ts). Everything that arrives is untrusted data: it is
// checked here, and nothing in it is ever run.
//
//   index.html?open=<url>&in=desk|dos|web&mode=play|edit     fetch a game from <url>
//   index.html#/open?url=<url>&in=…&mode=…                   the same, in the hash
//   index.html?receive&in=…&mode=…[&from=<origin>]            wait for the opener (or the
//   index.html#/receive?in=…&mode=…[&from=<origin>]           iframe parent) to post the files

/** Where the game opens: the 1994 desk, DOS Game-Maker (dos.html), or today's web interface. */
export type Target = 'desk' | 'dos' | 'web';
/** To play it, or to change a copy of it. */
export type Mode = 'play' | 'edit';

export const TARGETS: readonly Target[] = ['desk', 'dos', 'web'];
export const MODES: readonly Mode[] = ['play', 'edit'];

/** The most files one game may bring (the CD's biggest game folders have a few hundred). */
export const MAX_FILES = 1024;
/** The most bytes in all, unpacked (the biggest CD game is under 20 MB). */
export const MAX_TOTAL_BYTES = 48 * 1024 * 1024;
/** The most bytes in one file. */
export const MAX_FILE_BYTES = 16 * 1024 * 1024;
/** A game's name is cut to this many characters. */
export const MAX_NAME = 60;
/** How long the page waits for the opener's files after saying it is ready. */
export const WAIT_MS = 60_000;

export const READY = 'gm-ready';
export const FILES = 'gm-files';
export const RECEIVED = 'gm-received';
export const ERROR = 'gm-error';

/** What an address asks for: a game to fetch, or one to wait for. */
export type LinkRequest = { kind: 'open'; url: string; in?: Target; mode: Mode } | { kind: 'receive'; in?: Target; mode: Mode; from?: string };

const target = (v: unknown): Target | undefined => (TARGETS.includes(v as Target) ? (v as Target) : undefined);
const mode = (v: unknown): Mode => (v === 'edit' ? 'edit' : 'play');

/** An origin as the browser writes it (scheme://host[:port]), or undefined. */
export function cleanOrigin(text: string | null | undefined): string | undefined {
  if (!text) return undefined;
  try {
    const u = new URL(text);
    return /^https?:$/.test(u.protocol) ? u.origin : undefined;
  } catch {
    return undefined;
  }
}

/**
 * The game an address asks for (`search` is location.search, `hash` location.hash, `base` the
 * page's own address, for a relative ?open=), or undefined when it asks for none. Only http(s)
 * and same-site addresses are fetched.
 */
export function parseLinkRequest(search: string, hash: string, base: string): LinkRequest | undefined {
  const q = new URLSearchParams(search);
  const raw = hash.replace(/^#\/?/, '');
  const at = raw.indexOf('?');
  const route = (at < 0 ? raw : raw.slice(0, at)).replace(/\/+$/, '');
  const hq = new URLSearchParams(at < 0 ? '' : raw.slice(at + 1));
  const pick = (name: string) => q.get(name) ?? hq.get(name);
  const url = q.get('open') ?? (route === 'open' ? hq.get('url') : null);
  if (url !== null) {
    const resolved = fetchableUrl(url, base);
    return resolved ? { kind: 'open', url: resolved, in: target(pick('in')), mode: mode(pick('mode')) } : undefined;
  }
  if (q.has('receive') || route === 'receive') {
    return { kind: 'receive', in: target(pick('in')), mode: mode(pick('mode')), from: cleanOrigin(pick('from')) };
  }
  return undefined;
}

/** An address the page may fetch a game from: http or https only (no data:, blob:, file: or javascript:). */
export function fetchableUrl(url: string, base: string): string | undefined {
  try {
    const u = new URL(url.trim(), base);
    return /^https?:$/.test(u.protocol) ? u.href : undefined;
  } catch {
    return undefined;
  }
}

/** A received file's bytes, or undefined when the value is not bytes. */
export function asBytes(v: unknown): Uint8Array | undefined {
  if (v instanceof ArrayBuffer) return new Uint8Array(v);
  if (ArrayBuffer.isView(v)) return new Uint8Array(v.buffer, v.byteOffset, v.byteLength);
  return undefined;
}

/** A name made safe to show and store: no control characters, trimmed, at most MAX_NAME long. */
export function cleanName(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const s = v.replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029\u202a-\u202e\u2066-\u2069]/g, '').trim();
  return s ? s.slice(0, MAX_NAME).trim() : undefined;
}

/** One received file's name, kept to a safe file name (folders are dropped later, as DOS names). */
const FILE_NAME = /^[^\u0000-\u001f<>:"|?*]{1,255}$/;

export interface ReceivedGame {
  name?: string;
  files: [string, Uint8Array][];
  in?: Target;
  mode?: Mode;
  /** The .gam to play, when the sender says. */
  gam?: string;
}

export class LinkError extends Error {
  constructor(
    message: string,
    /** Why, for the sender's gm-error reply. */
    readonly reason: 'invalid' | 'too-big' | 'fetch' | 'cors' | 'declined' | 'timeout' | 'no-game' | 'storage',
  ) {
    super(message);
  }
}

/** Throws a LinkError when there are too many files or bytes. */
export function checkLimits(files: readonly (readonly [string, Uint8Array])[]): void {
  if (!files.length) throw new LinkError('No files came with the game.', 'invalid');
  if (files.length > MAX_FILES) throw new LinkError(`That is ${files.length} files; a game may have at most ${MAX_FILES}.`, 'too-big');
  let total = 0;
  for (const [name, bytes] of files) {
    if (bytes.length > MAX_FILE_BYTES) throw new LinkError(`${name} is ${mb(bytes.length)}; one file may be at most ${mb(MAX_FILE_BYTES)}.`, 'too-big');
    total += bytes.length;
  }
  if (total > MAX_TOTAL_BYTES) throw new LinkError(`The game is ${mb(total)}; it may be at most ${mb(MAX_TOTAL_BYTES)}.`, 'too-big');
}

export const mb = (n: number) => (n >= 1024 * 1024 ? `${(n / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/**
 * A gm-files message, checked: its files as bytes and its settings, or a LinkError saying
 * what is wrong. Unknown fields are ignored.
 */
export function readFilesMessage(data: unknown): ReceivedGame {
  if (!data || typeof data !== 'object' || (data as { type?: unknown }).type !== FILES)
    throw new LinkError('That message is not a gm-files message.', 'invalid');
  const m = data as Record<string, unknown>;
  const raw = m.files;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || raw instanceof ArrayBuffer || ArrayBuffer.isView(raw)) {
    throw new LinkError('The message’s files must be an object of file name → ArrayBuffer.', 'invalid');
  }
  const names = Object.keys(raw);
  if (names.length > MAX_FILES) throw new LinkError(`That is ${names.length} files; a game may have at most ${MAX_FILES}.`, 'too-big');
  const files: [string, Uint8Array][] = [];
  for (const name of names) {
    if (!FILE_NAME.test(name)) throw new LinkError(`A file name is not allowed: ${JSON.stringify(name.slice(0, 40))}.`, 'invalid');
    const bytes = asBytes((raw as Record<string, unknown>)[name]);
    if (!bytes) throw new LinkError(`${name} is not an ArrayBuffer or typed array.`, 'invalid');
    files.push([name, bytes]);
  }
  checkLimits(files);
  const gam = typeof m.gam === 'string' && FILE_NAME.test(m.gam) ? m.gam : undefined;
  return { name: cleanName(m.name), files, in: target(m.in), mode: m.mode === 'edit' || m.mode === 'play' ? m.mode : undefined, gam };
}

/** How the consent dialog names where a game came from. */
export function originLabel(origin: string): string {
  if (!origin || origin === 'null') return 'A page with no web address (a local file or a sandboxed frame)';
  try {
    return new URL(origin).host || origin;
  } catch {
    return origin;
  }
}

/** The name a received game is kept under, so it is clear where it came from. */
export function keptName(name: string, origin: string): string {
  const host = origin && origin !== 'null' ? originLabel(origin) : 'another page';
  return `${name} (from ${host})`.slice(0, MAX_NAME + 40);
}

// Capsule v1: what Scoot carries when it travels between screens, as a small binary file (SCOOT.SCT).
// Only ids and numbers, never text, so it cannot carry a name or anything a player typed: the
// courier's home id and world id, the screen that wrote it, the trip id, packages
// (empty for now) and the postcards it collected on the way, each a screen's home id, world id and
// stamps. A catalog game's stamp is a 32-bit hash of its id, looked up in the receiver's public
// catalog; one it does not know arrives as the mystery stamp.
//
// Every id (home, from, trip) is a UUID version 4: 122 random bits from crypto.randomUUID or
// crypto.getRandomValues, derived from nothing (no time, MAC, hardware or serial number, user agent
// or world name), so two screens in one household cannot be linked by their ids. Other versions
// (v1 holds a time and a MAC, v6/v7 a time, v3/v5 a hash of a name) are refused. A port (CYD, Pi)
// makes its ids the same way from its hardware random number generator: on an ESP32, esp_random()
// with the radio on or bootloader_random_enable(); on a Pi, its hardware RNG (/dev/hwrng or
// getrandom). Never from the efuse MAC or a serial number.
//
// Little-endian, 512 bytes at most:
//
//   'SCT1' | version 1 | table version | flags 0 | world | trip id (16) | home id (16) | from id (16)
//   | package count (0..3), a u32 hash each | postcard count (0..8), then per postcard:
//   home id (16) | world | stamp count, then a kind byte each (0 game + u32 hash, 1 Sample CD,
//   2 graduation, 3 mystery) | CRC-32 of everything before it
//
// decodeCapsule checks all of it before anything is written, so a bad file changes nothing.
import { TABLE_VERSION, WORLDS, type StampKind } from './tables';

export const CAPSULE_VERSION = 1;
export const CAPSULE_MAX = 512;
const MAGIC = [0x53, 0x43, 0x54, 0x31]; // SCT1
const MAX_POSTCARDS = 8;
const MAX_STAMPS = 64;
const MAX_PACKAGES = 3;
const KINDS: readonly StampKind[] = ['game', 'sample-cd', 'graduation', 'mystery'];

/** A stamp in a capsule: a catalog game by id (hashed on the way), or a kind. */
export interface TripStamp {
  kind: StampKind;
  game?: string;
}

/** A postcard Scoot carries: the screen it is from (its home id) and that screen's world. */
export interface TripCard {
  from: string;
  world: number;
  stamps: TripStamp[];
}

export interface Capsule {
  /** A UUID v4, one per trip. */
  trip: string;
  /** The courier's home: its UUID and world id. */
  home: string;
  world: number;
  /** The UUID of the screen that wrote this capsule. */
  from: string;
  /** Catalog game ids (empty for now). */
  packages: string[];
  postcards: TripCard[];
}

/** Why a file was refused, in words courierText.ts gives. */
export type CapsuleProblem = 'size' | 'not-capsule' | 'version' | 'tampered' | 'malformed';

export class CapsuleError extends Error {
  constructor(readonly problem: CapsuleProblem) {
    super(`capsule refused: ${problem}`);
  }
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

/** CRC-32 (the ZIP one). */
export function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (const b of bytes) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** FNV-1a, 32 bits: a catalog game id's hash in a capsule. */
export function gameHash(id: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

/** A UUID version 4 (version nibble 4, variant 8 to b), lowercase: the only ids a courier keeps or carries. */
export const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const uuidBytes = (id: string): number[] => {
  if (!UUID_V4.test(id)) throw new CapsuleError('malformed');
  return id
    .replace(/-/g, '')
    .match(/../g)!
    .map((b) => parseInt(b, 16));
};
const hex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
const uuid = (b: Uint8Array) => {
  const s = hex(b);
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
};

/** A new UUID v4, all random; crypto.randomUUID where the page allows it (a secure context), else from crypto.getRandomValues. */
export function newId(useRandomUUID = typeof crypto.randomUUID === 'function'): string {
  if (useRandomUUID) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  return uuid(b);
}

const u32 = (out: number[], n: number) => out.push(n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff);

/** The capsule's bytes, CRC-32 last. Throws `CapsuleError('size')` past 512 bytes. */
export function encodeCapsule(c: Capsule): Uint8Array {
  if (c.packages.length > MAX_PACKAGES || c.postcards.length > MAX_POSTCARDS) throw new CapsuleError('size');
  const out: number[] = [...MAGIC, CAPSULE_VERSION, TABLE_VERSION, 0, c.world & 0xff];
  out.push(...uuidBytes(c.trip), ...uuidBytes(c.home), ...uuidBytes(c.from));
  out.push(c.packages.length);
  for (const p of c.packages) u32(out, gameHash(p));
  out.push(c.postcards.length);
  for (const p of c.postcards) {
    if (p.stamps.length > MAX_STAMPS) throw new CapsuleError('size');
    out.push(...uuidBytes(p.from), p.world & 0xff, p.stamps.length);
    for (const s of p.stamps) {
      const k = KINDS.indexOf(s.kind);
      if (k === 0 && s.game) {
        out.push(0);
        u32(out, gameHash(s.game));
      } else out.push(k > 0 ? k : 3);
    }
  }
  if (out.length + 4 > CAPSULE_MAX) throw new CapsuleError('size');
  const body = Uint8Array.from(out);
  const all = new Uint8Array(body.length + 4);
  all.set(body);
  new DataView(all.buffer).setUint32(body.length, crc32(body), true);
  return all;
}

/** The capsule's size in bytes, or Infinity when it would not fit. */
export function capsuleSize(c: Capsule): number {
  try {
    return encodeCapsule(c).length;
  } catch {
    return Infinity;
  }
}

/**
 * Reads a capsule, checking its size, magic, version, table version, CRC-32 and every count and
 * id; throws `CapsuleError` on the first problem. `game` turns a stamp's hash back into a public
 * catalog id; one it does not know (a secret game's among them) arrives as the mystery stamp.
 */
export function decodeCapsule(bytes: Uint8Array, game: (hash: number) => string | undefined): Capsule {
  if (bytes.length > CAPSULE_MAX || bytes.length < 62) throw new CapsuleError('size');
  if (MAGIC.some((m, i) => bytes[i] !== m)) throw new CapsuleError('not-capsule');
  if (bytes[4] !== CAPSULE_VERSION || bytes[5] < 1 || bytes[5] > TABLE_VERSION) throw new CapsuleError('version');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.length);
  const end = bytes.length - 4;
  if (crc32(bytes.subarray(0, end)) !== view.getUint32(end, true)) throw new CapsuleError('tampered');
  let at = 0;
  const take = (n: number) => {
    if (at + n > end) throw new CapsuleError('malformed');
    const b = bytes.subarray(at, at + n);
    at += n;
    return b;
  };
  const byte = () => take(1)[0];
  const word = () => new DataView(take(4).slice().buffer).getUint32(0, true);
  const world = () => {
    const w = byte();
    if (w >= WORLDS.length) throw new CapsuleError('malformed');
    return w;
  };
  const id = () => {
    const u = uuid(take(16));
    if (!UUID_V4.test(u)) throw new CapsuleError('malformed');
    return u;
  };
  take(6);
  if (byte() !== 0) throw new CapsuleError('malformed'); // flags: none yet
  const cap: Capsule = { world: world(), trip: id(), home: id(), from: id(), packages: [], postcards: [] };
  const packages = byte();
  if (packages > MAX_PACKAGES) throw new CapsuleError('malformed');
  for (let i = 0; i < packages; i++) {
    const g = game(word());
    if (g) cap.packages.push(g);
  }
  const cards = byte();
  if (cards > MAX_POSTCARDS) throw new CapsuleError('malformed');
  for (let i = 0; i < cards; i++) {
    const card: TripCard = { from: id(), world: world(), stamps: [] };
    const n = byte();
    if (n > MAX_STAMPS) throw new CapsuleError('malformed');
    for (let j = 0; j < n; j++) {
      const k = byte();
      if (k >= KINDS.length) throw new CapsuleError('malformed');
      if (k > 0) card.stamps.push({ kind: KINDS[k] });
      else {
        const g = game(word());
        card.stamps.push(g ? { kind: 'game', game: g } : { kind: 'mystery' });
      }
    }
    if (cap.postcards.some((p) => p.from === card.from)) throw new CapsuleError('malformed');
    cap.postcards.push(card);
  }
  if (at !== end) throw new CapsuleError('malformed');
  return cap;
}

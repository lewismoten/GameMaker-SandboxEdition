// JSON for a backup's sections that keeps binary data exact: a Uint8Array (a save, a game's
// file, a C: drive record's bytes) is written as {"$bytes": "<base64>"}, and an object that
// happens to have a "$bytes" key of its own as {"$obj": {...}}. No DOM.

const BYTES = '$bytes';
const OBJ = '$obj';

function toBase64(b: Uint8Array): string {
  let s = '';
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(s);
}

function fromBase64(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function pack(v: unknown): unknown {
  if (v instanceof Uint8Array) return { [BYTES]: toBase64(v) };
  if (v instanceof ArrayBuffer) return { [BYTES]: toBase64(new Uint8Array(v)) };
  if (Array.isArray(v)) return v.map(pack);
  if (v && typeof v === 'object') {
    const o: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v)) if (x !== undefined) o[k] = pack(x);
    return BYTES in o || OBJ in o ? { [OBJ]: o } : o;
  }
  return v;
}

function unpack(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(unpack);
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    const keys = Object.keys(o);
    if (keys.length === 1 && keys[0] === BYTES && typeof o[BYTES] === 'string') return fromBase64(o[BYTES]);
    if (keys.length === 1 && keys[0] === OBJ && o[OBJ] && typeof o[OBJ] === 'object') {
      const inner: Record<string, unknown> = {};
      for (const [k, x] of Object.entries(o[OBJ])) inner[k] = unpack(x);
      return inner;
    }
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(o)) out[k] = unpack(x);
    return out;
  }
  return v;
}

/** A value as backup JSON text. */
export const encode = (v: unknown): string => JSON.stringify(pack(v));

/** Backup JSON text back to its value; throws on text that isn't JSON. */
export const decode = (text: string): unknown => unpack(JSON.parse(text));

/** The same data (bytes compared byte for byte, key order ignored). */
export function same(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a instanceof Uint8Array || b instanceof Uint8Array) {
    if (!(a instanceof Uint8Array && b instanceof Uint8Array) || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((x, i) => same(x, b[i]));
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const ka = Object.keys(a).filter((k) => (a as Record<string, unknown>)[k] !== undefined);
    const kb = Object.keys(b).filter((k) => (b as Record<string, unknown>)[k] !== undefined);
    if (ka.length !== kb.length) return false;
    return ka.every((k) => same((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
  }
  return false;
}

/** Bytes a value takes as backup JSON (before the zip packs it). */
export const sizeOf = (v: unknown): number => new TextEncoder().encode(encode(v)).length;

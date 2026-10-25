// Seeded random numbers and a string hash, written once for the pictures, songs, maps and
// walkthroughs that must come out the same every time. Small and import-free, so any chunk
// can use it. Mulberry32 (Tommy Ettinger), xorshift32 (George Marsaglia) and FNV-1a (Fowler,
// Noll and Vo) are public domain; see NOTICE.md.

/** Mulberry32, the generator games/kit/pixels.ts seeds the simulators with: numbers in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Xorshift32: numbers in [0, 1); a seed of 0 counts as 1. */
export function xorshift32(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

/** FNV-1a over the string's UTF-16 code units, as an unsigned 32-bit number: a seed from text. */
export function fnv1a(s: string): number {
  let x = 2166136261;
  for (let i = 0; i < s.length; i++) x = Math.imul(x ^ s.charCodeAt(i), 16777619);
  return x >>> 0;
}

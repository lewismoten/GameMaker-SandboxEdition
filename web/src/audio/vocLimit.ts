// How big a .VOC may be. PLAYGAME reads the whole file into one buffer sized and read with a
// 16-bit count (code/GM/SOUNDC.C PlaySbVocFile: `new char[vocfilesize]`, `read(..., (uint)
// vocfilesize)`), so a file of 64 KB or more is cut short or fails to load and plays nothing.
// The web engine has no such limit; this is the editor warning authors ahead of DOS.

/** The most bytes (header included) a .VOC may have for PLAYGAME: what a 16-bit count holds. */
export const VOC_MAX_BYTES = 0xffff;

/** What encodeVoc adds around the samples: 26-byte header, a 6-byte block head, a 1-byte end. */
const VOC_OVERHEAD = 26 + 6 + 1;

/** The most 8-bit samples one encoded .VOC can hold within the limit. */
export const VOC_MAX_SAMPLES = VOC_MAX_BYTES - VOC_OVERHEAD;

/** The encoded size of a .VOC holding this many samples. */
export const vocBytesFor = (samples: number): number => samples + VOC_OVERHEAD;

/** True when a .VOC file of this many bytes is more than PLAYGAME can load. */
export const vocTooBig = (bytes: number): boolean => bytes > VOC_MAX_BYTES;

/** A short, suggestion-worded line about an oversize .VOC, for findings and import warnings. */
export function vocLimitNote(name: string, bytes: number): string {
  const kb = (bytes / 1024).toFixed(1);
  return `${name} is ${kb} KB (${bytes.toLocaleString()} bytes). Under DOS, PLAYGAME can only load a sound under 64 KB (65,535 bytes), so a larger one is likely to play nothing or cut off. You could shorten it, or play it at a lower rate; the web player plays it either way.`;
}

// ---- stutter estimates -------------------------------------------------------------------
// PLAYGAME reads the whole .VOC from disk on the game's own thread each time it plays a sound
// (SOUNDC.C PlaySbVocFile: open, read, close), so the picture freezes for the read time.
// One game tick is 54.9 ms. The figures below are ESTIMATES from period hard-disk speeds, not
// measurements: a 286 ~30 ms to open and seek plus ~400 KB/s; a 486 ~15 ms plus ~1 MB/s.
// (programmer's guide notes, ch. 10b.) A floppy or CD-ROM is several times slower.

/** One game tick in milliseconds (a timer rate of 18.2 per second). */
export const TICK_MS = 54.9;
/** Game ticks per second. */
export const TICKS_PER_SECOND = 1000 / TICK_MS;
/** Estimated hard-disk read time for a .VOC of this size, in ms. */
export const readMs = (bytes: number, pc: 'pc286' | 'pc486'): number => (pc === 'pc286' ? 30 + bytes / 400 : 15 + bytes / 1000);
/** At this size a 286's read takes about one game tick (yellow). */
export const VOC_MAYBE_BYTES = 10_000;
/** At this size a 286's read takes about two ticks (red). */
export const VOC_LIKELY_BYTES = 32_000;

export type StutterLevel = 'ok' | 'maybe' | 'likely' | 'toobig';

/** How likely a .VOC of this many bytes is to stall play on a slow PC. */
export const stutterLevel = (bytes: number): StutterLevel =>
  bytes > VOC_MAX_BYTES ? 'toobig' : bytes >= VOC_LIKELY_BYTES ? 'likely' : bytes >= VOC_MAYBE_BYTES ? 'maybe' : 'ok';

/** A suggestion-worded line about a .VOC's read time, or '' when it is small enough. */
export function stutterNote(bytes: number): string {
  const level = stutterLevel(bytes);
  if (level === 'ok') return '';
  const t286 = Math.round(readMs(bytes, 'pc286'));
  const t486 = Math.round(readMs(bytes, 'pc486'));
  const ticks = (ms: number) => (ms / TICK_MS).toFixed(1);
  const head = level === 'maybe' ? 'may stutter on slower PCs' : level === 'likely' ? 'is likely to stutter on slower PCs' : 'is over what DOS can load';
  return `A sound this size ${head}: DOS reads the whole file from disk while the game waits, an estimated ${t286} ms (${ticks(t286)} game ticks) on a 286 and ${t486} ms on a 486 with a hard disk. A floppy is slower. A shorter clip or a lower rate helps, and so does playing it on a pickup that goes away instead of a block touched for several ticks. The web player plays it either way.`;
}

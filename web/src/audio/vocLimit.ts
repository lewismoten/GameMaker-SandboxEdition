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

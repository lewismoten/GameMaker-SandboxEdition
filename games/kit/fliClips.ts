// A long intro cut into short FLIs played one after another in a slide list. PLAYGAME's
// FLI::View plays every frame of an FLI before ShowGraphic reads a key, so Esc waits for
// the animation to end; in a list of short clips it answers at the next join. Between clips
// PLAYGAME changes nothing on screen (ShowGraphic opens the next file, PauseTimeKey(0) looks
// for a key, and FLI::View draws over what is there), so a clip carries on from the last
// frame of the one before. Each clip after the first opens on the next frame drawn whole,
// with its palette (encodeFli sets it in frame 0, after the bands when a frame is split), and
// cuts fall where the palette holds and the least of the picture changes, so the joins don't
// show. The fade to black stays at the end of the last clip.
import { applyFliFrame, encodeFli, newFliCanvas, parseFli } from '../../web/src/formats/fli';
import type { SlideEntry } from '../../web/src/formats/graphicScripts';

/** How long an FLI plays, in seconds (FLI::View waits `speed` 1/70 s after each frame). */
export function fliSeconds(fli: Uint8Array): number {
  const a = parseFli(fli);
  return (a.frameCount * a.speed) / 70;
}

/** Every frame's pixels and palette, as FLI::View leaves the screen after it. */
function decode(fli: Uint8Array): { frames: Uint8Array[]; palettes: Uint8Array[]; w: number; h: number; speed: number } {
  const a = parseFli(fli);
  const c = newFliCanvas(a);
  const frames: Uint8Array[] = [];
  const palettes: Uint8Array[] = [];
  for (let f = 0; f < a.frameCount; f++) {
    applyFliFrame(a, f, c);
    frames.push(Uint8Array.from(c.pixels));
    palettes.push(Uint8Array.from(c.palette));
  }
  return { frames, palettes, w: a.width, h: a.height, speed: a.speed };
}

const same = (a: Uint8Array, b: Uint8Array) => a.length === b.length && a.every((v, i) => v === b[i]);

/** What a cut before frame `i` costs: a palette change there shows, then the pixels that change. */
function cutCost(frames: Uint8Array[], palettes: Uint8Array[], i: number): number {
  let n = same(palettes[i - 1], palettes[i]) ? 0 : 1e9;
  const a = frames[i - 1];
  const b = frames[i];
  for (let k = 0; k < a.length; k++) if (a[k] !== b[k]) n++;
  return n;
}

/** The first frame of each clip after the first: as few clips as hold `most` frames each. */
function cuts(frames: Uint8Array[], palettes: Uint8Array[], most: number): number[] {
  const total = frames.length;
  const out: number[] = [];
  let start = 0;
  while (total - start > most) {
    const left = Math.ceil((total - start) / most);
    const target = start + Math.round((total - start) / left);
    // anywhere from a little before the even split to as late as the clip may run
    // (but late enough that the rest still fits the clips left)
    const lo = Math.max(start + 1, target - Math.floor(most / 4), total - (left - 1) * most);
    const hi = Math.min(start + most, total - 1);
    let best = hi;
    let bestCost = Infinity;
    for (let i = lo; i <= hi; i++) {
      const c = cutCost(frames, palettes, i);
      if (c < bestCost) [best, bestCost] = [i, c];
    }
    out.push(best);
    start = best;
  }
  return out;
}

/** The clip names: the first keeps `name`, the rest add 2, 3… to its first 7 letters (DOS 8.3). */
function clipName(name: string, k: number): string {
  if (k === 0) return name;
  const dot = name.lastIndexOf('.');
  return `${name.slice(0, dot).slice(0, 7)}${k + 1}${name.slice(dot)}`;
}

/**
 * The FLI as clips of at most `seconds` each, by file name in play order. One that plays no
 * longer than a quarter more than `seconds` stays whole, under its own name.
 */
export function fliClips(name: string, fli: Uint8Array, seconds = 4): Record<string, Uint8Array> {
  if (fliSeconds(fli) <= seconds * 1.25) return { [name]: fli };
  const { frames, palettes, w, h, speed } = decode(fli);
  const most = Math.max(1, Math.floor((seconds * 70) / Math.max(1, speed)));
  const starts = [0, ...cuts(frames, palettes, most), frames.length];
  const out: Record<string, Uint8Array> = {};
  for (let k = 0; k + 1 < starts.length; k++) {
    const fs = frames.slice(starts[k], starts[k + 1]);
    const ps = palettes.slice(starts[k], starts[k + 1]);
    out[clipName(name, k)] = encodeFli(fs, ps[0], { width: w, height: h, speed, palettes: ps, runs: true });
  }
  return out;
}

/** The clips' slide-list entries: no pause between them, `pause` after the last. */
export function clipEntries(clips: Record<string, Uint8Array>, pause?: number): SlideEntry[] {
  const names = Object.keys(clips);
  return names.map((n, i) => (i < names.length - 1 ? { name: n, pause: 0 } : { name: n, pause }));
}

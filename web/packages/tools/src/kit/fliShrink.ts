// Smaller FLIs: a size report and shrink steps, pure and DOM-free so the editor and a game's
// build call the same code. A step takes decoded frames (decodeFli) and options and returns new
// frames, the encoder options it needs, the bytes it saves and how visible the change is.
// Only the chunks PLAYGAME plays are written (COLOR64, LC, BRUN; see encodeFli).
import { applyFliFrame, encodeFli, newFliCanvas, parseFli } from '@lewismoten/gamemaker-sandbox-engine/formats/fli';

/** An FLI's frames as the player shows them: pixels and the (6-bit) palette per frame. */
export interface FliFrames {
  frames: Uint8Array[];
  palettes: Uint8Array[];
  width: number;
  height: number;
  /** The wait after each frame, in 1/70 s. */
  speed: number;
}

/** How the encoder writes the frames (set by steps, passed to encodeFrames). */
export interface FliEncodeOptions {
  sparsePalettes?: boolean;
}

/** How much a step changes what shows, frame for frame against the frames the step was given (0 to 255 per color channel). */
export interface Visibility {
  /** The mean over every pixel of every frame (0 = identical). */
  mean: number;
  /** The biggest single difference. */
  worst: number;
  /** How many pixels differ at all, as a share of all of them (0 to 1). */
  changedShare: number;
}

export interface StepResult {
  name: string;
  /** True when what shows is exactly the same. */
  lossless: boolean;
  frames: FliFrames;
  encode: FliEncodeOptions;
  bytesBefore: number;
  bytesAfter: number;
  savedBytes: number;
  visibility: Visibility;
}

/** Every frame's pixels and palette, as FLI::View leaves the screen after it (the ring frame is not one). */
export function decodeFli(fli: Uint8Array): FliFrames {
  const a = parseFli(fli);
  const c = newFliCanvas(a);
  const frames: Uint8Array[] = [];
  const palettes: Uint8Array[] = [];
  for (let f = 0; f < a.frameCount; f++) {
    applyFliFrame(a, f, c);
    frames.push(Uint8Array.from(c.pixels));
    palettes.push(Uint8Array.from(c.palette));
  }
  return { frames, palettes, width: a.width, height: a.height, speed: a.speed };
}

/** The frames as an FLI (no ring frame, run packets on). */
export function encodeFrames(f: FliFrames, opts: FliEncodeOptions = {}): Uint8Array {
  return encodeFli(f.frames, f.palettes[0], {
    width: f.width,
    height: f.height,
    speed: f.speed,
    palettes: f.palettes,
    runs: true,
    noLoopFrame: true,
    sparsePalettes: opts.sparsePalettes,
  });
}

// ---- the report ----

const CHUNK_NAMES: Record<number, string> = { 4: 'COLOR256', 7: 'SS2', 11: 'COLOR64', 12: 'LC', 13: 'BLACK', 15: 'BRUN', 16: 'COPY', 18: 'PSTAMP' };

export interface FrameReport {
  frame: number;
  bytes: number;
  /** Bytes by chunk type name (the frame header's 16 bytes under 'header'). */
  chunks: Record<string, number>;
  /** Pixels that differ from the frame before. */
  changedPixels: number;
}

export interface FliReport {
  totalBytes: number;
  frames: FrameReport[];
  /** Bytes by chunk type name over every frame. */
  byChunk: Record<string, number>;
  /** Plain-words reasons the file is big, biggest first; suggestions, not verdicts. */
  findings: string[];
}

/** Bytes per chunk type for every frame, and why the file is the size it is. */
export function fliReport(fli: Uint8Array): FliReport {
  const a = parseFli(fli);
  const d = decodeFli(fli);
  const dv = new DataView(fli.buffer, fli.byteOffset, fli.byteLength);
  const frames: FrameReport[] = [];
  const byChunk: Record<string, number> = {};
  for (let i = 0; i < a.frameCount; i++) {
    const p = a.frames[i];
    const chunks: Record<string, number> = { header: 16 };
    let q = p + 16;
    for (let k = 0, n = dv.getUint16(p + 6, true); k < n; k++) {
      const size = dv.getUint32(q, true);
      const name = CHUNK_NAMES[dv.getUint16(q + 4, true)] ?? String(dv.getUint16(q + 4, true));
      chunks[name] = (chunks[name] ?? 0) + size;
      q += size;
    }
    let changed = 0;
    const prev = d.frames[i - 1];
    if (!prev) changed = d.frames[i].length;
    else for (let k = 0; k < prev.length; k++) if (prev[k] !== d.frames[i][k]) changed++;
    for (const [k, v] of Object.entries(chunks)) byChunk[k] = (byChunk[k] ?? 0) + v;
    frames.push({ frame: i, bytes: dv.getUint32(p, true), chunks, changedPixels: changed });
  }
  const findings: string[] = [];
  const total = fli.length;
  const big = [...frames].sort((x, y) => y.bytes - x.bytes)[0];
  if (big && big.bytes > total * 0.25)
    findings.push(
      `Frame ${big.frame + 1} is ${Math.round((big.bytes / total) * 100)}% of the file: a whole new picture. Dithered or speckled art costs the most there; flatter shading costs less.`,
    );
  const color = byChunk.COLOR64 ?? 0;
  if (color > total * 0.04)
    findings.push(
      `Palette changes take ${Math.round((color / total) * 100)}%: fades resend colors a frame does not draw (sparse palettes, a smaller palette).`,
    );
  const noisy = frames.filter((f) => f.frame > 0 && f.changedPixels > 0 && f.bytes / f.changedPixels > 1.5 && f.changedPixels > 400);
  if (noisy.length > frames.length * 0.2)
    findings.push(
      `${noisy.length} frames change many pixels by a little (noise or dither that moves): holding still areas still, or snapping near colors, cuts them.`,
    );
  const still = frames.filter((f) => f.frame > 0 && f.changedPixels === 0).length;
  if (still > frames.length * 0.3)
    findings.push(`${still} frames repeat the one before: they cost their header only, but dropping frames and lengthening delays would save more.`);
  return { totalBytes: total, frames, byChunk, findings };
}

// ---- measuring ----

/** The color at index i of a 6-bit palette as 8-bit channels. */
const channel = (pal: Uint8Array, i: number, j: number): number => Math.round(((pal[i * 3 + j] & 63) * 255) / 63);

/** What shows, original against `result` (frame i of the original is `map(i)` of the result). */
export function visibilityOf(orig: FliFrames, result: FliFrames, map: (i: number) => number = (i) => i): Visibility {
  let sum = 0;
  let worst = 0;
  let changed = 0;
  let n = 0;
  for (let i = 0; i < orig.frames.length; i++) {
    const a = orig.frames[i];
    const pa = orig.palettes[i];
    const k = Math.min(result.frames.length - 1, map(i));
    const b = result.frames[k];
    const pb = result.palettes[k];
    for (let x = 0; x < a.length; x++) {
      n++;
      if (a[x] === b[x] && pa === pb) continue;
      let dmax = 0;
      for (let j = 0; j < 3; j++) dmax = Math.max(dmax, Math.abs(channel(pa, a[x], j) - channel(pb, b[x], j)));
      if (dmax) changed++;
      sum += dmax;
      worst = Math.max(worst, dmax);
    }
  }
  return { mean: n ? sum / n : 0, worst, changedShare: n ? changed / n : 0 };
}

function result(
  name: string,
  lossless: boolean,
  orig: FliFrames,
  out: FliFrames,
  encode: FliEncodeOptions,
  base: FliEncodeOptions,
  map?: (i: number) => number,
): StepResult {
  const bytesBefore = encodeFrames(orig, base).length;
  const bytesAfter = encodeFrames(out, { ...base, ...encode }).length;
  return {
    name,
    lossless,
    frames: out,
    encode: { ...base, ...encode },
    bytesBefore,
    bytesAfter,
    savedBytes: bytesBefore - bytesAfter,
    visibility: lossless ? { mean: 0, worst: 0, changedShare: 0 } : visibilityOf(orig, out, map),
  };
}

const dist = (pal: Uint8Array, a: number, b: number): number => Math.max(...[0, 1, 2].map((j) => Math.abs(channel(pal, a, j) - channel(pal, b, j))));

// ---- the steps ----

/** The palette of the frame that shows most light (not one faded toward black). */
function brightest(f: FliFrames): Uint8Array {
  const light = (p: Uint8Array) => p.reduce((s, v) => s + v, 0);
  return f.palettes.reduce((a, b) => (light(b) > light(a) ? b : a));
}

/**
 * Lossy: a pixel alone between two pixels (left and right, or above and below) of one other
 * color within `tolerance` takes that color, so dithering and speckle between close shades
 * flatten into runs. Gradients show as bands; edges and sprites keep their shape.
 */
export function flattenDitherStep(orig: FliFrames, opts: { tolerance: number }, base: FliEncodeOptions = {}): StepResult {
  const { width: w, height: h } = orig;
  const pal = brightest(orig); // one palette decides every frame, so a fade does not change the choices
  const frames = orig.frames.map((f) => {
    const px = Uint8Array.from(f);
    const flat = (at: number, a: number, b: number) => {
      if (px[a] === px[b] && px[at] !== px[a] && dist(pal, px[at], px[a]) <= opts.tolerance) px[at] = px[a];
    };
    for (let y = 0; y < h; y++) for (let x = 1; x < w - 1; x++) flat(y * w + x, y * w + x - 1, y * w + x + 1);
    for (let y = 1; y < h - 1; y++) for (let x = 0; x < w; x++) flat(y * w + x, (y - 1) * w + x, (y + 1) * w + x);
    return px;
  });
  return result('flatten dithering', false, orig, { ...orig, frames }, {}, base);
}

/** Lossless: palette changes only for the colors a frame draws. */
export function sparsePalettesStep(orig: FliFrames, base: FliEncodeOptions = {}): StepResult {
  return result('sparse palettes', true, orig, orig, { sparsePalettes: true }, base);
}

/**
 * Lossy: a pixel whose color is within `tolerance` (0 to 255 per channel) of what it was the
 * frame before keeps the old index, so dither or noise that shifts a little stops costing
 * bytes. Frames whose palette changes (fades) are left alone.
 */
export function holdStillStep(orig: FliFrames, opts: { tolerance: number }, base: FliEncodeOptions = {}): StepResult {
  const frames = orig.frames.map((f) => Uint8Array.from(f));
  for (let i = 1; i < frames.length; i++) {
    if (orig.palettes[i] !== orig.palettes[i - 1] && orig.palettes[i].some((v, k) => v !== orig.palettes[i - 1][k])) continue;
    const pal = orig.palettes[i];
    const prev = frames[i - 1];
    const cur = frames[i];
    for (let x = 0; x < cur.length; x++) if (cur[x] !== prev[x] && dist(pal, cur[x], prev[x]) <= opts.tolerance) cur[x] = prev[x];
  }
  return result('hold still areas still', false, orig, { ...orig, frames }, {}, base);
}

/** The nearest color of `keep` to index `c` in `pal`. */
function nearest(pal: Uint8Array, c: number, keep: number[]): number {
  let best = keep[0];
  let bd = Infinity;
  for (const k of keep) {
    const d = [0, 1, 2].reduce((s, j) => s + (channel(pal, c, j) - channel(pal, k, j)) ** 2, 0);
    if (d < bd) [best, bd] = [k, d];
  }
  return best;
}

/**
 * Lossy: colors within `tolerance` of a more used color in the first frame's palette are
 * merged into it in every frame, so near-identical shades stop making changes.
 */
export function snapColorsStep(orig: FliFrames, opts: { tolerance: number }, base: FliEncodeOptions = {}): StepResult {
  const pal = brightest(orig);
  const use = new Array<number>(256).fill(0);
  for (const f of orig.frames) for (let x = 0; x < f.length; x += 7) use[f[x]]++;
  const order = use.map((n, c) => c).sort((a, b) => use[b] - use[a]);
  const map = Array.from({ length: 256 }, (_, c) => c);
  const kept: number[] = [];
  for (const c of order) {
    if (!use[c]) continue;
    const near = kept.find((k) => dist(pal, c, k) <= opts.tolerance);
    if (near === undefined) kept.push(c);
    else map[c] = near;
  }
  const frames = orig.frames.map((f) => f.map((v) => map[v]));
  return result('snap near colors', false, orig, { ...orig, frames }, {}, base);
}

/** Lossy: at most `colors` different colors drawn in the whole animation; the least used are replaced by their nearest kept one. */
export function maxColorsStep(orig: FliFrames, opts: { colors: number }, base: FliEncodeOptions = {}): StepResult {
  const pal = brightest(orig);
  const use = new Array<number>(256).fill(0);
  for (const f of orig.frames) for (let x = 0; x < f.length; x++) use[f[x]]++;
  const order = use
    .map((n, c) => c)
    .filter((c) => use[c])
    .sort((a, b) => use[b] - use[a]);
  const keep = order.slice(0, Math.max(1, opts.colors));
  const map = Array.from({ length: 256 }, (_, c) => c);
  for (const c of order.slice(keep.length)) map[c] = nearest(pal, c, keep);
  const frames = orig.frames.map((f) => f.map((v) => map[v]));
  return result('fewer colors', false, orig, { ...orig, frames }, {}, base);
}

/**
 * Lossy: every other frame is dropped and the wait doubles, so the cartoon lasts as long.
 * The result is steppier. Fades keep their last frames; a wait over 255 is not offered.
 */
export function dropFramesStep(orig: FliFrames, base: FliEncodeOptions = {}): StepResult {
  const keep = (i: number) => i % 2 === 0 || i === orig.frames.length - 1;
  const idx = orig.frames.map((_, i) => i).filter(keep);
  const out: FliFrames = { ...orig, frames: idx.map((i) => orig.frames[i]), palettes: idx.map((i) => orig.palettes[i]), speed: Math.min(255, orig.speed * 2) };
  return result('drop every other frame', false, orig, out, {}, base, (i) => (i >= orig.frames.length - 1 ? idx.length - 1 : i >> 1));
}

export type ShrinkStep =
  | { step: 'sparsePalettes' }
  | { step: 'holdStill'; tolerance: number }
  | { step: 'snapColors'; tolerance: number }
  | { step: 'flattenDither'; tolerance: number }
  | { step: 'maxColors'; colors: number }
  | { step: 'onePalette'; colors: number }
  | ({ step: 'frame' } & FrameOptions)
  | { step: 'dropFrames' };

/** Runs the steps in order, each on the one before's frames; the last result's `frames` and `encode` make the file. */
export function shrinkFrames(orig: FliFrames, steps: ShrinkStep[]): StepResult[] {
  const out: StepResult[] = [];
  let cur = orig;
  let enc: FliEncodeOptions = {};
  for (const s of steps) {
    const r =
      s.step === 'sparsePalettes'
        ? sparsePalettesStep(cur, enc)
        : s.step === 'holdStill'
          ? holdStillStep(cur, s, enc)
          : s.step === 'snapColors'
            ? snapColorsStep(cur, s, enc)
            : s.step === 'flattenDither'
              ? flattenDitherStep(cur, s, enc)
              : s.step === 'maxColors'
                ? maxColorsStep(cur, s, enc)
                : s.step === 'onePalette'
                  ? onePaletteStep(cur, s, enc)
                  : s.step === 'frame'
                    ? frameStep(cur, s, enc)
                    : dropFramesStep(cur, enc);
    out.push(r);
    cur = r.frames;
    enc = r.encode;
  }
  return out;
}

/** What shows over a whole chain of steps: the end result against the original, exactly (a dropped frame's picture stands for the two it replaces). */
export function chainVisibility(orig: FliFrames, last: FliFrames): Visibility {
  const n = orig.frames.length;
  const m = last.frames.length;
  return visibilityOf(orig, last, m === n ? (i) => i : (i) => (i >= n - 1 ? m - 1 : i >> 1));
}

/** A 6-bit RGB key (18 bits) for a palette entry. */
const rgbKey = (pal: Uint8Array, i: number): number => ((pal[i * 3] & 63) << 12) | ((pal[i * 3 + 1] & 63) << 6) | (pal[i * 3 + 2] & 63);

/** At most `n` colors for a weighted set of colors, by median cut: the box with the most to lose is split at its weighted middle. */
function medianCut(keys: number[], weight: Map<number, number>, n: number): number[] {
  const ch = (k: number, c: number) => (k >> (12 - 6 * c)) & 63;
  const boxes: number[][] = [keys];
  const range = (b: number[]) => {
    let best = 0;
    let at = 0;
    for (let c = 0; c < 3; c++) {
      const v = b.map((k) => ch(k, c));
      const r = Math.max(...v) - Math.min(...v);
      if (r > best) [best, at] = [r, c];
    }
    return { best, at };
  };
  while (boxes.length < n) {
    let pick = -1;
    let score = 0;
    boxes.forEach((b, i) => {
      if (b.length < 2) return;
      const sc = range(b).best * b.reduce((s, k) => s + weight.get(k)!, 0);
      if (sc > score) [pick, score] = [i, sc];
    });
    if (pick < 0) break;
    const b = boxes[pick];
    const { at } = range(b);
    b.sort((x, y) => ch(x, at) - ch(y, at));
    const half = b.reduce((s, k) => s + weight.get(k)!, 0) / 2;
    let acc = 0;
    let cut = 1;
    for (let i = 0; i < b.length - 1; i++) {
      acc += weight.get(b[i])!;
      cut = i + 1;
      if (acc >= half) break;
    }
    boxes.splice(pick, 1, b.slice(0, cut), b.slice(cut));
  }
  return boxes.map((b) => {
    const w = b.reduce((s, k) => s + weight.get(k)!, 0) || 1;
    const avg = [0, 1, 2].map((c) => Math.round(b.reduce((s, k) => s + ch(k, c) * weight.get(k)!, 0) / w));
    return (avg[0] << 12) | (avg[1] << 6) | avg[2];
  });
}

/**
 * Lossy (lossless when the animation already draws no more than `colors` shades): one palette
 * for the whole animation, the `colors` (up to 256) that best stand for every shade it shows, and
 * every frame redrawn in it. No COLOR chunk follows the first frame, so a fade becomes pixel
 * changes, which often cost more than the palette changes did. The numbers say which way it went.
 */
export function onePaletteStep(orig: FliFrames, opts: { colors: number }, base: FliEncodeOptions = {}): StepResult {
  const n = Math.max(1, Math.min(256, Math.round(opts.colors)));
  const weight = new Map<number, number>();
  orig.frames.forEach((f, i) => {
    const pal = orig.palettes[i];
    const seen = new Uint32Array(256);
    for (let x = 0; x < f.length; x++) seen[f[x]]++;
    for (let c = 0; c < 256; c++) if (seen[c]) weight.set(rgbKey(pal, c), (weight.get(rgbKey(pal, c)) ?? 0) + seen[c]);
  });
  const keys = [...weight.keys()];
  const chosen = keys.length <= n ? keys : medianCut(keys, weight, n);
  const palette = new Uint8Array(768);
  chosen.forEach((k, i) => {
    palette[i * 3] = k >> 12;
    palette[i * 3 + 1] = (k >> 6) & 63;
    palette[i * 3 + 2] = k & 63;
  });
  const at = new Map<number, number>();
  const nearestOf = (k: number): number => {
    let hit = at.get(k);
    if (hit !== undefined) return hit;
    let bd = Infinity;
    hit = 0;
    chosen.forEach((c, i) => {
      const d = [12, 6, 0].reduce((s, sh) => s + (((k >> sh) & 63) - ((c >> sh) & 63)) ** 2, 0);
      if (d < bd) [hit, bd] = [i, d];
    });
    at.set(k, hit);
    return hit;
  };
  const frames = orig.frames.map((f, i) => {
    const pal = orig.palettes[i];
    const map = Uint8Array.from({ length: 256 }, (_, c) => nearestOf(rgbKey(pal, c)));
    return f.map((v) => map[v]);
  });
  const out: FliFrames = { ...orig, frames, palettes: frames.map(() => palette) };
  return result('one palette', keys.length <= n, orig, out, {}, base);
}

/** How `frameStep` frames the picture; every number is in pixels except `zoom`. */
export interface FrameOptions {
  /** Solid bands left at each edge. */
  top: number;
  bottom: number;
  left: number;
  right: number;
  /** The picture's scale inside the bands: 1 = its own pixels, under 1 shrinks it, over 1 magnifies it. */
  zoom: number;
  /** Where the picture's center sits in the original's pixels, from the middle (0 = centered). */
  panX: number;
  panY: number;
}

/** The palette entry bands are drawn in: color 0 when the first palette makes it black, else its darkest color. */
export function bandColor(pal: Uint8Array): number {
  let best = 0;
  let bl = Infinity;
  for (let c = 0; c < 256; c++) {
    const l = (pal[c * 3] & 63) + (pal[c * 3 + 1] & 63) + (pal[c * 3 + 2] & 63);
    if (l < bl) [best, bl] = [c, l];
    if (c === 0 && l === 0) return 0;
  }
  return best;
}

/**
 * Lossy (lossless when nothing is set): the picture stays the same size, but only the area inside
 * the bands shows it. The bands are one solid color (`bandColor`) and never change after the first
 * frame, so they cost next to nothing. At zoom 1 the bands just cover the picture's edges. Otherwise the picture is scaled by `zoom` about its center, moved by
 * the pan, into the middle of that area: smaller by averaging the pixels it covers into the nearest
 * color of the frame's own palette, larger by repeating pixels (no new colors, edges stay crisp).
 */
export function frameStep(orig: FliFrames, o: FrameOptions, base: FliEncodeOptions = {}): StepResult {
  const { width: w, height: h } = orig;
  const clamp = (v: number, hi: number) => Math.max(0, Math.min(hi, Math.round(v) || 0));
  const left = clamp(o.left, w - 1);
  const right = clamp(o.right, w - 1 - left);
  const top = clamp(o.top, h - 1);
  const bottom = clamp(o.bottom, h - 1 - top);
  const z = Math.max(0.05, Math.min(8, o.zoom || 1));
  const identity = !left && !right && !top && !bottom && z === 1 && !o.panX && !o.panY;
  if (identity) return result('frame it', true, orig, orig, {}, base);
  const band = bandColor(orig.palettes[0]);
  const iw = w - left - right;
  const ih = h - top - bottom;
  // at 100% with no pan the bands only cover the picture's edges; any other zoom centers it in the area
  const mask = z === 1 && !o.panX && !o.panY;
  const icx = mask ? w / 2 : left + iw / 2;
  const icy = mask ? h / 2 : top + ih / 2;
  const frames = orig.frames.map((src, fi) => {
    const out = new Uint8Array(w * h).fill(band);
    const pal = orig.palettes[fi];
    const used = new Uint8Array(256);
    for (let x = 0; x < src.length; x++) used[src[x]] = 1;
    const cands = [...used.keys()].filter((c) => used[c]);
    const cache = new Map<number, number>();
    const rgb = (c: number, j: number) => pal[c * 3 + j] & 63;
    for (let y = 0; y < ih; y++) {
      const dy = top + y;
      // the rows of the original this row covers
      const sy0 = h / 2 + o.panY + (dy - icy) / z;
      const sy1 = sy0 + 1 / z;
      for (let x = 0; x < iw; x++) {
        const dx = left + x;
        const sx0 = w / 2 + o.panX + (dx - icx) / z;
        const sx1 = sx0 + 1 / z;
        if (z >= 1) {
          const sx = Math.floor(sx0 + 0.5 / z);
          const sy = Math.floor(sy0 + 0.5 / z);
          if (sx >= 0 && sx < w && sy >= 0 && sy < h) out[dy * w + dx] = src[sy * w + sx];
          continue;
        }
        const ax = Math.max(0, Math.floor(sx0));
        const bx = Math.min(w - 1, Math.ceil(sx1) - 1);
        const ay = Math.max(0, Math.floor(sy0));
        const by = Math.min(h - 1, Math.ceil(sy1) - 1);
        if (ax > bx || ay > by) continue;
        const first = src[ay * w + ax];
        let same = true;
        let r = 0;
        let g = 0;
        let b = 0;
        let n = 0;
        for (let yy = ay; yy <= by; yy++)
          for (let xx = ax; xx <= bx; xx++) {
            const c = src[yy * w + xx];
            if (c !== first) same = false;
            r += rgb(c, 0);
            g += rgb(c, 1);
            b += rgb(c, 2);
            n++;
          }
        if (same) {
          out[dy * w + dx] = first;
          continue;
        }
        const key = (Math.round(r / n) << 12) | (Math.round(g / n) << 6) | Math.round(b / n);
        let hit = cache.get(key);
        if (hit === undefined) {
          let bd = Infinity;
          hit = first;
          for (const c of cands) {
            const d = (rgb(c, 0) - (key >> 12)) ** 2 + (rgb(c, 1) - ((key >> 6) & 63)) ** 2 + (rgb(c, 2) - (key & 63)) ** 2;
            if (d < bd) [hit, bd] = [c, d];
          }
          cache.set(key, hit);
        }
        out[dy * w + dx] = hit;
      }
    }
    return out;
  });
  return result('frame it', false, orig, { ...orig, frames }, {}, base);
}

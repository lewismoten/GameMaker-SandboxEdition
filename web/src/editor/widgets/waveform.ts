// Drawing digital sounds: an oscilloscope-style waveform (the min/max of the samples under
// each pixel column), with an optional selection, cursor and play head.

interface WaveStyle {
  background?: string;
  wave?: string;
  grid?: string;
  /** Selected samples [start, end), drawn highlighted. */
  selection?: { start: number; end: number };
  /** A cursor or play head, in samples. */
  marks?: { at: number; color: string }[];
  /** Draw a time line every this many samples. */
  tick?: number;
}

/** Draws the samples to fill the canvas (its pixel size, not its CSS size). */
export function drawWave(c: HTMLCanvasElement, s: Float32Array, style: WaveStyle = {}): void {
  const ctx = c.getContext('2d')!;
  const { width: w, height: hgt } = c;
  ctx.fillStyle = style.background ?? '#0d1a10';
  ctx.fillRect(0, 0, w, hgt);
  const n = s.length;
  const x = (i: number) => (n ? (i / n) * w : 0);
  // time lines and the centre line
  ctx.fillStyle = style.grid ?? 'rgba(108, 242, 138, 0.14)';
  if (style.tick && n) for (let t = style.tick; t < n; t += style.tick) ctx.fillRect(Math.round(x(t)), 0, 1, hgt);
  ctx.fillRect(0, Math.floor(hgt / 2), w, 1);
  const sel = style.selection && style.selection.end > style.selection.start ? style.selection : undefined;
  if (sel) {
    ctx.fillStyle = 'rgba(255, 212, 0, 0.18)';
    ctx.fillRect(x(sel.start), 0, Math.max(1, x(sel.end) - x(sel.start)), hgt);
  }
  const wave = style.wave ?? '#ffb44a';
  for (let px = 0; px < w; px++) {
    const a = Math.floor((px / w) * n);
    const b = Math.max(a + 1, Math.floor(((px + 1) / w) * n));
    let lo = 0;
    let hi = 0;
    for (let i = a; i < b && i < n; i++) {
      const v = s[i];
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
    ctx.fillStyle = sel && a >= sel.start && a < sel.end ? '#fff3b0' : wave;
    const y0 = Math.round((0.5 - hi / 2) * (hgt - 2)) + 1;
    const y1 = Math.round((0.5 - lo / 2) * (hgt - 2)) + 1;
    ctx.fillRect(px, y0, 1, Math.max(1, y1 - y0));
  }
  for (const m of style.marks ?? []) {
    ctx.fillStyle = m.color;
    ctx.fillRect(Math.min(w - 2, Math.round(x(m.at))), 0, 2, hgt);
  }
}

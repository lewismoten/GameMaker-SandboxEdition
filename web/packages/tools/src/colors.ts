// Generic color ramps and VGA palette lighting; game-specific ramp names stay with games.
import { vga8 } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
export type RGB = readonly [number, number, number];
export type TimeOfDay = 'morning' | 'noon' | 'afternoon' | 'sunset' | 'night' | 'show';
export interface Lighting {
  readonly mul: RGB;
  readonly add: RGB;
}
/** Eight-bit RGB lighting presets; show is warm stage lighting. */
export const TIME_OF_DAY_LIGHT: Readonly<Record<TimeOfDay, Lighting>> = {
  morning: { mul: [1.0, 0.94, 0.94], add: [14, 4, 10] },
  noon: { mul: [1, 1, 1], add: [0, 0, 0] },
  afternoon: { mul: [1.02, 0.96, 0.86], add: [8, 4, 0] },
  sunset: { mul: [0.9, 0.7, 0.74], add: [30, 10, 16] },
  night: { mul: [0.46, 0.5, 0.78], add: [8, 8, 30] },
  // Under the big top at night: warm show lights on everything.
  show: { mul: [1.0, 0.9, 0.86], add: [12, 4, 6] },
};
/** Eight-bit sky ramp endpoints and optional middle stop, dark to light. */
export const TIME_OF_DAY_SKY: Readonly<Record<TimeOfDay, readonly [RGB, RGB, RGB?]>> = {
  morning: [
    [120, 150, 230],
    [255, 214, 200],
    [200, 190, 240],
  ],
  noon: [
    [70, 130, 230],
    [200, 232, 255],
  ],
  afternoon: [
    [90, 140, 220],
    [250, 236, 200],
    [170, 200, 240],
  ],
  sunset: [
    [60, 40, 120],
    [255, 170, 90],
    [210, 90, 120],
  ],
  night: [
    [8, 8, 30],
    [40, 40, 96],
  ],
  show: [
    [6, 6, 28],
    [60, 40, 110],
  ],
};

const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
function rgb(c: RGB): void {
  if (c.length !== 3 || c.some((v) => !Number.isFinite(v))) throw new RangeError('RGB must contain three finite components');
}
/** Light one eight-bit RGB color, rounding and clamping each component. */
export function lightColor(color: RGB, lighting: TimeOfDay | Lighting): [number, number, number] {
  rgb(color);
  const t = typeof lighting === 'string' ? TIME_OF_DAY_LIGHT[lighting] : lighting;
  rgb(t.mul);
  rgb(t.add);
  return color.map((v, i) => clamp(v * t.mul[i] + t.add[i])) as [number, number, number];
}
/** A pure eight-bit RGB ramp, including both endpoints; a middle stop falls at t=0.5. */
export function colorRamp(count: number, from: RGB, to: RGB, mid?: RGB): [number, number, number][] {
  if (!Number.isSafeInteger(count) || count < 1 || count > 256) throw new RangeError('Ramp size must be 1..256');
  rgb(from);
  rgb(to);
  if (mid) rgb(mid);
  return Array.from({ length: count }, (_, k) => {
    const t = count === 1 ? 0 : k / (count - 1);
    const [a, b, u] = mid ? (t < 0.5 ? ([from, mid, t * 2] as const) : ([mid, to, (t - 0.5) * 2] as const)) : ([from, to, t] as const);
    return a.map((v, i) => clamp(v + (b[i] - v) * u)) as [number, number, number];
  });
}
/**
 * Light a native 768-byte, six-bit VGA palette, without changing pixel indexes or the input.
 * Indexes 0 (engine clear color) and 255 (transparent) are preserved by default. Supply
 * your own list to protect glowing ramps, designer colors, or to adjust every entry ([]).
 */
export function adjustPalette(palette: Uint8Array, lighting: TimeOfDay | Lighting, preserve: readonly number[] = [0, 255]): Uint8Array {
  if (palette.length !== 768 || palette.some((v) => v > 63)) throw new RangeError('Expected a 768-byte six-bit VGA palette');
  if (preserve.some((i) => !Number.isInteger(i) || i < 0 || i > 255)) throw new RangeError('Preserved palette indexes must be 0..255');
  const keep = new Set(preserve),
    out = palette.slice();
  for (let i = 0; i < 256; i++) {
    if (keep.has(i)) continue;
    const color: RGB = [vga8(palette[i * 3]), vga8(palette[i * 3 + 1]), vga8(palette[i * 3 + 2])];
    out.set(
      lightColor(color, lighting).map((v) => v >> 2),
      i * 3,
    );
  }
  return out;
}

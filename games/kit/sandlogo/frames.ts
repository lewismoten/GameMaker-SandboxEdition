// Quantized logo frames, palette fades and the cached animation sequence.
import { clamp01 } from '@lewismoten/gamemaker-sandbox-tools/kit/raytrace';
import { medianCutPalette, Quantizer } from '@lewismoten/gamemaker-sandbox-tools/kit/quantize';
import { W, H, SPEED, FADE_IN, FADE, FRAMES } from './settings';
import { renderFrame } from './render';
import { FLAT, drawSoftware } from './software';

const toBytes = (f: Float32Array): Uint8Array => {
  const out = new Uint8Array(f.length);
  for (let i = 0; i < f.length; i++) out[i] = Math.round(clamp01(f[i]) * 255);
  return out;
};

interface LogoFrames {
  frames: Uint8Array[];
  /** A palette per frame (the fades). */
  palettes: Uint8Array[];
  palette: Uint8Array;
  speed: number;
}

let cached: LogoFrames | undefined;

/** Every frame of the sting as 320x200 indexed pixels, with their palettes. */
export function sandLogoFrames(): LogoFrames {
  if (cached) return cached;
  const rgb: Uint8Array[] = [];
  for (let f = 0; f < FRAMES; f++) {
    const fl = renderFrame(f);
    rgb.push(toBytes(fl));
  }
  const palette = medianCutPalette(rgb, FLAT);
  const q = new Quantizer(palette, 5);
  const frames = rgb.map((c, f) => drawSoftware(q.apply(c, W, H), f));
  const palettes = frames.map((_, f) => {
    const k = f < FADE_IN ? (f + 1) / (FADE_IN + 1) : f >= FRAMES - FADE ? (FRAMES - 1 - f) / FADE : 1;
    return palette.map((v) => Math.round(v * k));
  });
  cached = { frames, palettes, palette, speed: SPEED };
  return cached;
}

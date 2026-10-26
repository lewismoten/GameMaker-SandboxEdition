// Palettes. Every stage palette starts with the same "common" ramps at the same indexes
// (the ship, shots, explosions, bullets, pickups and the virus's colors are drawn once
// and used in every stage), followed by that stage's own ramps.
import { PaletteBuilder } from '../../../kit/palette';

type RGB = [number, number, number];

export class Pal {
  readonly b = new PaletteBuilder();
  ramp(name: string, n: number, from: RGB, to: RGB, mid?: RGB): number[] {
    return this.b.ramp(name, n, from, to, mid);
  }
  r(name: string): number[] {
    return this.b.get(name);
  }
  /** ramp `name` at shade k (clamped). */
  c(name: string, k: number): number {
    const r = this.b.get(name);
    return r[Math.max(0, Math.min(r.length - 1, Math.round(k)))];
  }
  get pal(): Uint8Array {
    return this.b.pal;
  }
}

/** The ramps every palette shares, in a fixed order (so sprites look the same everywhere). */
function common(p: Pal): void {
  p.ramp('ink', 1, [0, 0, 0], [0, 0, 0]);
  p.b.designerColors();
  p.ramp('steel', 7, [22, 26, 40], [236, 242, 255], [120, 134, 160]);
  p.ramp('cyan', 6, [0, 40, 90], [220, 255, 255], [40, 190, 240]);
  p.ramp('fire', 8, [70, 0, 0], [255, 255, 235], [255, 120, 0]);
  p.ramp('virus', 6, [40, 0, 56], [255, 170, 255], [190, 40, 220]);
  p.ramp('slime', 6, [10, 40, 0], [220, 255, 140], [100, 210, 30]);
  p.ramp('gold', 5, [90, 50, 0], [255, 240, 150], [240, 180, 30]);
  p.ramp('pink', 5, [100, 0, 40], [255, 220, 240], [255, 60, 150]);
  p.ramp('gray', 8, [16, 16, 20], [250, 250, 250]);
  p.ramp('red', 5, [70, 0, 0], [255, 170, 150], [230, 30, 20]);
  p.ramp('blue', 5, [0, 10, 70], [170, 200, 255], [30, 80, 230]);
  // the colors PLAYGAME looks for when it writes text (match() picks the nearest)
  p.ramp('tRed', 1, [252, 40, 40], [252, 40, 40]);
  p.ramp('tBlue', 1, [40, 40, 252], [40, 40, 252]);
  p.ramp('tPurple', 1, [200, 40, 200], [200, 40, 200]);
  p.ramp('tYellow', 1, [252, 252, 0], [252, 252, 0]);
}

export type Theme = 'disk' | 'board' | 'ram' | 'sound' | 'cpu' | 'screen';

/** Stage-specific ramps. Each stage has 'base' (the floor), 'deep', 'trim' and 'glow'. */
function themed(p: Pal, theme: Theme): void {
  switch (theme) {
    case 'disk':
      p.ramp('base', 8, [20, 24, 36], [235, 240, 252], [112, 124, 150]);
      p.ramp('deep', 5, [6, 6, 10], [70, 70, 84]);
      p.ramp('trim', 7, [70, 40, 10], [255, 240, 170], [220, 160, 40]);
      p.ramp('glow', 5, [60, 0, 10], [255, 210, 200], [255, 40, 40]);
      p.ramp('label', 5, [110, 100, 80], [255, 250, 230]);
      break;
    case 'board':
      p.ramp('base', 8, [0, 30, 14], [120, 220, 130], [20, 110, 50]);
      p.ramp('deep', 5, [4, 6, 6], [70, 74, 80]);
      p.ramp('trim', 7, [70, 40, 10], [255, 240, 170], [220, 150, 40]);
      p.ramp('glow', 5, [60, 20, 0], [255, 230, 160], [255, 120, 20]);
      p.ramp('label', 5, [40, 60, 120], [200, 220, 255]);
      break;
    case 'ram':
      p.ramp('base', 8, [2, 8, 34], [100, 140, 230], [20, 40, 120]);
      p.ramp('deep', 5, [4, 4, 10], [60, 62, 80]);
      p.ramp('trim', 7, [60, 40, 10], [255, 240, 170], [210, 160, 50]);
      p.ramp('glow', 5, [0, 50, 40], [200, 255, 230], [0, 230, 160]);
      p.ramp('label', 5, [80, 80, 90], [240, 240, 250]);
      break;
    case 'sound':
      p.ramp('base', 8, [30, 4, 4], [230, 120, 90], [130, 30, 24]);
      p.ramp('deep', 5, [4, 4, 4], [64, 60, 64]);
      p.ramp('trim', 7, [50, 40, 30], [255, 240, 200], [200, 170, 110]);
      p.ramp('glow', 5, [60, 40, 0], [255, 255, 190], [255, 200, 0]);
      p.ramp('label', 5, [30, 50, 30], [200, 255, 200]);
      break;
    case 'cpu':
      p.ramp('base', 8, [10, 6, 30], [150, 210, 255], [50, 60, 140]);
      p.ramp('deep', 5, [2, 2, 6], [50, 40, 70]);
      p.ramp('trim', 7, [80, 50, 10], [255, 250, 200], [230, 180, 60]);
      p.ramp('glow', 5, [60, 0, 0], [255, 220, 200], [255, 50, 30]);
      p.ramp('label', 5, [30, 60, 60], [200, 255, 250]);
      break;
    case 'screen':
      p.ramp('base', 8, [4, 6, 24], [140, 170, 255], [30, 40, 120]);
      p.ramp('deep', 5, [2, 2, 8], [60, 60, 90]);
      p.ramp('trim', 7, [60, 40, 10], [255, 245, 190], [220, 160, 40]);
      p.ramp('glow', 5, [0, 40, 60], [210, 250, 255], [0, 190, 255]);
      p.ramp('label', 5, [150, 140, 120], [255, 252, 240]);
      // the beige 486 and the family room for the cartoons
      p.ramp('beige', 7, [70, 60, 44], [255, 250, 230], [200, 190, 160]);
      p.ramp('wood', 6, [40, 20, 8], [210, 150, 90], [130, 80, 40]);
      p.ramp('skin', 5, [90, 50, 30], [255, 220, 190], [220, 160, 120]);
      p.ramp('crt', 6, [0, 20, 30], [180, 255, 240], [0, 120, 140]);
      p.ramp('wall', 5, [30, 30, 50], [140, 140, 180]);
      break;
  }
}

export function buildPalette(theme: Theme): Pal {
  const p = new Pal();
  common(p);
  themed(p, theme);
  return p;
}

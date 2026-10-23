// A cartoon reel for FLI files drawn in code: frames are whole 320x200 pictures, the encoder
// stores only what changed (FLI line deltas), and fades are palette changes alone. Every
// reel opens on a black frame: Game-Maker's FLI player draws over whatever is on screen, the
// pictures fade in from black like PLAYGAME's GIFs, and the closing "ring" frame that FLI
// files end with (back to the first frame) is a few bytes of black instead of a whole picture.
import { encodeFli } from '../../web/src/formats/fli';
import { Pixels } from './pixels';

/** The palette (6-bit VGA) faded toward black: light 0 is black, 1 is unchanged. */
export function dimmed(pal: Uint8Array, light: number): Uint8Array {
  return pal.map((v) => Math.round(v * Math.max(0, Math.min(1, light))));
}

export class Reel {
  readonly frames: Uint8Array[] = [];
  readonly palettes: Uint8Array[] = [];
  private last?: { px: Uint8Array; pal: Uint8Array };

  constructor(
    /** The reel's palette (6-bit VGA, 768 bytes). */
    readonly pal: Uint8Array,
    readonly w = 320,
    readonly h = 200,
  ) {
    this.frames.push(new Uint8Array(w * h));
    this.palettes.push(new Uint8Array(768));
  }

  /** Adds a picture for `hold` frames, its palette faded to `light`. */
  add(p: Pixels, hold = 1, light = 1, pal = this.pal): this {
    const px = Uint8Array.from(p.px);
    const lit = light >= 1 ? pal : dimmed(pal, light);
    for (let i = 0; i < hold; i++) {
      this.frames.push(px);
      this.palettes.push(lit);
    }
    this.last = { px, pal };
    return this;
  }

  /** A picture drawn over a copy of `bg` (the actors over the scenery), for `hold` frames. */
  frame(bg: Pixels, draw: (p: Pixels) => void, hold = 1, light = 1, pal = this.pal): this {
    const p = new Pixels(bg.w, bg.h);
    p.px.set(bg.px);
    draw(p);
    return this.add(p, hold, light, pal);
  }

  /** The picture fading in from black over `n` frames (the last at full light). */
  fadeIn(p: Pixels, n: number, pal = this.pal): this {
    for (let k = 1; k <= n; k++) this.add(p, 1, k / n, pal);
    return this;
  }

  /** The last picture fading out to black over `n` frames. */
  fadeOut(n: number): this {
    const last = this.last;
    if (!last) return this;
    for (let k = n - 1; k >= 0; k--) {
      this.frames.push(last.px);
      this.palettes.push(dimmed(last.pal, k / n));
    }
    return this;
  }

  /** The .FLI: `speed` is the wait after each frame in 1/70 s (5 = 14 frames a second). */
  fli(speed: number): Uint8Array {
    return encodeFli(this.frames, this.pal, { width: this.w, height: this.h, speed, palettes: this.palettes, runs: true });
  }

  /** How long it plays, in seconds. */
  seconds(speed: number): number {
    return (this.frames.length * speed) / 70;
  }
}

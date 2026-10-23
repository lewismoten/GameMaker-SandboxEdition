// A regular's sprite as the cast stage plays it (public/cast/sprites.json, made by
// scripts/castSprites.ts from the games' own files): palette indexes, 0 see-through.

export interface CastSprite {
  w: number;
  h: number;
  /** Each color as 'rrggbb'; index i in a frame is colors[i - 1]. */
  colors: string[];
  /** Each frame's w x h indexes, base64. */
  frames: string[];
  /** How long each frame shows. */
  ms: number;
  /** Walks on (a hero or monster); false: a thing that is simply there (The Dog House). */
  walk: boolean;
  /** How many of `frames` are its walk; the rest are it facing you (else it faces you in its first frame). */
  nWalk?: number;
  /** Named extra moves (the goat's scream and faint): [first frame, count]. */
  acts?: Record<string, [number, number]>;
  /** Drawn facing left: turned round on stage. */
  mirror?: boolean;
  /** Rocks from side to side as it goes (the Easter egg). */
  wobble?: boolean;
  /** Hops along instead of walking (the tin heart). */
  hop?: boolean;
  /** Ticks as it goes: a tick-tock on each frame (when the stage's sound is on). */
  tick?: boolean;
}

/** The frames as canvases of their own size, ready to draw scaled with smoothing off. */
export function spriteCanvases(s: CastSprite): HTMLCanvasElement[] {
  const rgb = s.colors.map((c) => [0, 2, 4].map((k) => parseInt(c.slice(k, k + 2), 16)));
  return s.frames.map((f) => {
    const bytes = Uint8Array.from(atob(f), (ch) => ch.charCodeAt(0));
    const canvas = document.createElement('canvas');
    canvas.width = s.w;
    canvas.height = s.h;
    const ctx = canvas.getContext('2d')!;
    const img = ctx.createImageData(s.w, s.h);
    bytes.forEach((v, i) => {
      if (!v) return;
      img.data.set([...rgb[v - 1], 255], i * 4);
    });
    ctx.putImageData(img, 0, 0);
    return canvas;
  });
}

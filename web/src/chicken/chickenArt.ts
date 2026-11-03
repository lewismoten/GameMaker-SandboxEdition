// Lady Regina's tiara for the site's chicken pictures, in the same shapes and colors as Tune-Up's
// (games/tuneup/src/art/chicken.ts): a gold band in front of the comb, three points and a pink
// jewel. Each function draws on top of a chicken whose head is as the caller's picture has it.
const GOLD = '#f2c522';
const GOLD_EDGE = '#8a6a00';
const JEWEL = '#ff6fae';

/** SVG markup for the clock's chicken (viewBox 60x60: the head at about 44,14), to put after the head. */
export const TIARA_SVG = `<path d="M43.5 10.5 l0.8 -6 2 3 2.2 -5 2.2 5 2 -3 0.8 6 z" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.8" stroke-linejoin="round"/><circle cx="48.2" cy="7.6" r="1.3" fill="${JEWEL}" stroke="#a33" stroke-width="0.3"/>`;

/** Draws the tiara on the flying chicken (the desk window's, outside/chicken.ts), head at (8, -8.5). */
export function drawTiara(c: CanvasRenderingContext2D): void {
  c.fillStyle = GOLD;
  c.strokeStyle = GOLD_EDGE;
  c.lineWidth = 0.5;
  c.beginPath();
  c.moveTo(6.2, -10.8);
  c.lineTo(6.6, -14.4);
  c.lineTo(7.7, -12.6);
  c.lineTo(8.5, -15.4);
  c.lineTo(9.3, -12.6);
  c.lineTo(10.4, -14.4);
  c.lineTo(10.8, -10.8);
  c.closePath();
  c.fill();
  c.stroke();
  c.fillStyle = JEWEL;
  c.beginPath();
  c.arc(8.5, -12.2, 0.8, 0, Math.PI * 2);
  c.fill();
}

/** The cast stage's chicken sprite (cast/castSprite.ts shape) with the tiara over its comb: two rows taller, two new colors. */
export function ladySprite<S extends { w: number; h: number; colors: string[]; frames: string[] }>(s: S): S {
  const gold = s.colors.length + 1;
  const pink = s.colors.length + 2;
  const frames = s.frames.map((f) => {
    const old = Uint8Array.from(atob(f), (ch) => ch.charCodeAt(0));
    const px = new Uint8Array(s.w * (s.h + 2));
    px.set(old, 2 * s.w);
    // the comb's row and its left end: the tiara sits just above, from one column in front of it
    const at = old.findIndex((v) => v !== 0);
    const row = Math.floor(at / s.w);
    const col = at % s.w;
    // three points over a band with a pink jewel (the new rows are 2 higher than the comb's)
    const put = (r: number, c: number, v: number) => (px[(row + r) * s.w + c] = v);
    for (const c of [0, 2, 4]) put(0, col - 1 + c, gold);
    for (const c of [0, 1, 3, 4]) put(1, col - 1 + c, gold);
    put(1, col + 1, pink);
    return btoa(String.fromCharCode(...px));
  });
  return { ...s, h: s.h + 2, colors: [...s.colors, 'f2c522', 'ff6fae'], frames };
}

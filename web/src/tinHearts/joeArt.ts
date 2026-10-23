// Mystery Robot Joe for the tin heart scene (trophy.ts): his own 20x20 frames from Keep It
// Brief! (games/brief/src/sprites/joe.ts, copied as rows of colors so the web needs none of the
// game's code), facing you and walking (the side frames face left), plus what the scene adds:
// the little hatch on his tin chest, where the tally counter sits, and the golden heart behind it.
// Each letter is a color in COLORS; '.' is clear.

export const COLORS = ['fffa95', '6d7d8d', '08080c', 'f2f6ff', 'd6a128', 'c6ceda', '485061', 'ba1c18', 'ee6959', '99a5b6', 'fffaea', 'eaca5d', '996d18'].map(
  (c) => `#${c}`,
);

export type JoeFrame = 'stand' | 'step' | 'blink' | 'sideA' | 'sideB';

export const FRAMES: Record<JoeFrame, string[]> = {
  stand: [
    '.........aa.........',
    '.........bb.........',
    '.....cccccccccc.....',
    '.....cddddddddc.....',
    '.....ceeeffeeec.....',
    '.....ceceeeecec.....',
    '.....ceeeffeeec.....',
    '.....cdfgcgcfbc.....',
    '.....cccccccccc.....',
    '........hihh........',
    '....cccccccccccc....',
    '..bbcffccccccffc....',
    '..bbcfjckckcclmcbb..',
    '..bbcfjccccccjgcbb..',
    '..bbcfjjjjjjjjgcbb..',
    '..eeccccccccccccbb..',
    '.......bb...bb..ee..',
    '.......bb...bb......',
    '.......bb..cccc.....',
    '......cccc..........',
  ],
  step: [
    '.........aa.........',
    '.........bb.........',
    '.....cccccccccc.....',
    '.....cddddddddc.....',
    '.....ceeeffeeec.....',
    '.....ceceeeecec.....',
    '.....ceeeffeeec.....',
    '.....cdfgcgcfbc.....',
    '.....cccccccccc.....',
    '........hihh........',
    '....cccccccccccc....',
    '....cffccccccffcbb..',
    '..bbcfjckckcclmcbb..',
    '..bbcfjccccccjgcbb..',
    '..bbcfjjjjjjjjgcbb..',
    '..bbccccccccccccee..',
    '..ee...bb...bb......',
    '.......bb...bb......',
    '......cccc..bb......',
    '...........cccc.....',
  ],
  blink: [
    '.........aa.........',
    '.........bb.........',
    '.....cccccccccc.....',
    '.....cddddddddc.....',
    '.....ceeeffeeec.....',
    '.....cegeeeegec.....',
    '.....ceeeffeeec.....',
    '.....cdfgcgcfbc.....',
    '.....cccccccccc.....',
    '........hihh........',
    '....cccccccccccc....',
    '..bbcffccccccffc....',
    '..bbcfjckckcclmcbb..',
    '..bbcfjccccccjgcbb..',
    '..bbcfjjjjjjjjgcbb..',
    '..eeccccccccccccbb..',
    '.......bb...bb..ee..',
    '.......bb...bb......',
    '.......bb..cccc.....',
    '......cccc..........',
  ],
  sideA: [
    '.........aa.........',
    '.........bb.........',
    '.....cccccccccc.....',
    '.....cddddddddc.....',
    '.....ceeeffffbc.....',
    '.....cecemmmmbc.....',
    '.....ceeeffffbc.....',
    '.....cgggffffbc.....',
    '.....cccccccccc.....',
    '.......hihh.........',
    '....cccccccccccc....',
    '....cfffffbbfffc....',
    '....ceejjjbbjjgc....',
    '....ceejjjbbjjgc....',
    '....cfjjjjbbjjgc....',
    '....cccccceecccc....',
    '.........bbb........',
    '.........bbb........',
    '.........bbb........',
    '........ccccc.......',
  ],
  sideB: [
    '.........aa.........',
    '.........bb.........',
    '.....cccccccccc.....',
    '.....cddddddddc.....',
    '.....ceeeffffbc.....',
    '.....cecemmmmbc.....',
    '.....ceeeffffbc.....',
    '.....cgggffffbc.....',
    '.....cccccccccc.....',
    '.......hihh.........',
    '....cccccccccccc....',
    '....cffbbffffffc....',
    '....ceebbjjjjjgc....',
    '....ceebbjjjjjgc....',
    '....cfjbbjjjjjgc....',
    '....ccceeccccccc....',
    '.......bb...bb......',
    '.......bb...bb......',
    '.......bb...bb......',
    '......cccc.cccc.....',
  ],
};

export interface JoeLook {
  frame: JoeFrame;
  /** Side frames face left; mirrored, he faces right. */
  mirror?: boolean;
  /** The chest hatch: 0 shut (the tally counter shows) .. 1 swung wide open. Front frames only. */
  hatch?: number;
  /** The golden heart's glow, 0 .. 1. */
  glow?: number;
  /** Seconds: its glint steps round once a tick. */
  time?: number;
}

/** The chest window the hatch covers, in Joe's pixels: x, y, w, h. */
const HATCH = [7, 11, 6, 3] as const;

/** A heart outline (unit size, centered), for the golden heart. */
function heartPath(g: CanvasRenderingContext2D, cx: number, cy: number, s: number): void {
  g.beginPath();
  g.moveTo(cx, cy + s * 0.45);
  g.bezierCurveTo(cx - s * 0.62, cy, cx - s * 0.5, cy - s * 0.52, cx, cy - s * 0.2);
  g.bezierCurveTo(cx + s * 0.5, cy - s * 0.52, cx + s * 0.62, cy, cx, cy + s * 0.45);
  g.closePath();
}

/** Joe with his feet on (x + 10 px, y + 20 px): `px` is the size of one of his pixels. */
export function drawJoe(g: CanvasRenderingContext2D, x: number, y: number, px: number, look: JoeLook): void {
  const rows = FRAMES[look.frame];
  const front = !look.frame.startsWith('side');
  const hatch = front ? Math.max(0, Math.min(1, look.hatch ?? 0)) : 0;
  const [hx, hy, hw, hh] = HATCH;
  const inHatch = (cx: number, cy: number) => hatch > 0 && cx >= hx && cx < hx + hw && cy >= hy && cy < hy + hh;
  for (let r = 0; r < 20; r++)
    for (let c = 0; c < 20; c++) {
      const sx = look.mirror ? 19 - c : c;
      const ch = rows[r][sx];
      if (ch === '.' || inHatch(c, r)) continue;
      g.fillStyle = COLORS[ch.charCodeAt(0) - 97];
      g.fillRect(x + c * px, y + r * px, Math.ceil(px), Math.ceil(px));
    }
  if (!hatch) return;
  const glow = Math.max(0, Math.min(1, look.glow ?? 0));
  const t = look.time ?? 0;
  // the space behind the hatch, and the golden heart in it
  g.fillStyle = '#1b1408';
  g.fillRect(x + hx * px, y + hy * px, hw * px, hh * px);
  const cx = x + (hx + hw / 2) * px;
  const cy = y + (hy + hh / 2) * px;
  const s = hh * px * 1.25;
  const gold = g.createLinearGradient(cx - s / 2, cy - s / 2, cx + s / 2, cy + s / 2);
  gold.addColorStop(0, '#fff3b0');
  gold.addColorStop(0.45, '#f2c443');
  gold.addColorStop(1, '#a8740e');
  g.save();
  g.beginPath();
  g.rect(x + hx * px, y + hy * px, hw * px, hh * px);
  g.clip();
  heartPath(g, cx, cy + s * 0.05, s);
  g.fillStyle = gold;
  g.globalAlpha = 0.35 + 0.65 * glow;
  g.fill();
  g.globalAlpha = 1;
  // its glint steps along the top once a tick
  const step = Math.floor(t * 2) % 3;
  g.fillStyle = `rgba(255, 255, 240, ${0.4 + 0.6 * glow})`;
  g.fillRect(cx - s * 0.28 + step * s * 0.1, cy - s * 0.16, Math.max(1, px * 0.5), Math.max(1, px * 0.5));
  g.restore();
  // the hatch door, swinging out on its hinge at the left
  const open = Math.sin((hatch * Math.PI) / 2);
  const dw = Math.max(px * 0.6, hw * px * (1 - open));
  g.fillStyle = open > 0.6 ? '#99a5b6' : '#c6ceda';
  g.fillRect(x + hx * px - (open > 0.6 ? px * 0.6 : 0), y + hy * px, dw, hh * px);
  g.strokeStyle = '#08080c';
  g.lineWidth = Math.max(1, px * 0.25);
  g.strokeRect(x + hx * px - (open > 0.6 ? px * 0.6 : 0), y + hy * px, dw, hh * px);
  g.fillStyle = '#d6a128';
  g.fillRect(x + (hx - 0.3) * px, y + hy * px, px * 0.5, px * 0.5);
  g.fillRect(x + (hx - 0.3) * px, y + (hy + hh - 0.5) * px, px * 0.5, px * 0.5);
  // the warm light it gives off
  if (glow > 0) {
    g.save();
    g.globalCompositeOperation = 'lighter';
    const rg = g.createRadialGradient(cx, cy, 0, cx, cy, px * 9);
    rg.addColorStop(0, `rgba(255, 196, 70, ${0.5 * glow})`);
    rg.addColorStop(1, 'rgba(255, 196, 70, 0)');
    g.fillStyle = rg;
    g.fillRect(cx - px * 9, cy - px * 9, px * 18, px * 18);
    g.restore();
  }
}

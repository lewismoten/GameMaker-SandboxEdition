// The BBS's mug pictures as badges, the way the games' are (gameBadge.ts): a scene of the
// board's ANSI art in a round medallion ringed in its colors, the name lifted off onto a
// ribbon that runs out past the ring, and a scroll over the bottom. Everything is real CP437
// text in the 16 text-mode colors at the VGA font's size, 8 x 16 a cell; outside the badge the
// picture is see-through, so the mug's white shows.
import { TextScreen, attr, COLS, ROWS } from '../../retro/text/textScreen';
import { SANDBOX_ANSI, bigText, bigTextWidth, centered, sandboxLogin } from '../../retro/bbs/ansiArt';
import { toCp437 } from '../../retro/text/cp437';
import { OUTLINE, blank, medallion, rgb, ribbon, stamp, trimSprite, type Rgba } from './gameBadge';

export type BbsDesignId = 'logo' | 'scene' | 'banner' | 'gm';

/** The picture's size (room for a ribbon's tails either side of the 640-pixel screen), and the medallion's middle and radii. */
const W = COLS * 8 + 40;
const H = 448;
const CX = W / 2;
const CY = H / 2;
const PIC_R = 196;
const RING = 212;
/** The scene's text screen (25 rows) sits this far down the picture. */
const SCENE_Y = (H - ROWS * 16) / 2;
/** Room for a ribbon's tails past its band (gameBadge.ts draws them 14 pixels out). */
const TAIL = 16;

const VGA = { black: '#000000', brown: '#aa5500', gray: '#aaaaaa', blue: '#5555ff', cyan: '#55ffff', yellow: '#ffff55' };

interface Look {
  /** The ring's color, and the ribbons' edges and tails. */
  ring: string;
  edge: string;
  tail: string;
  /** The scene inside the medallion, on an 80 x 25 screen. */
  scene: (s: TextScreen) => void;
  /** The name for the ribbon, drawn from the screen's top row. */
  title: (s: TextScreen) => void;
  /** The ribbon's top, in the picture. */
  titleY: number;
  /** A line of pipe-colored text for the scroll over the bottom. */
  scroll: string;
}

/** The logon screen, from which the scenes borrow the name, the castle, the pail and the dunes. */
function login(): TextScreen {
  const s = new TextScreen(document.createElement('canvas'));
  s.destroy();
  sandboxLogin(s);
  return s;
}

/** Copies a block of cells from the logon screen, leaving out empty ones and (with `noDunes`) the dunes' (they start on row 16). */
function copy(s: TextScreen, from: TextScreen, x0: number, y0: number, w: number, h: number, dx: number, dy: number, noDunes = false): void {
  const dune = new Set([attr(14, 0) * 256 + 220, attr(6, 14) * 256 + 176, attr(6, 14) * 256 + 177]);
  for (let y = y0; y < y0 + h; y++)
    for (let x = x0; x < x0 + w; x++) {
      const ch = from.chars[y * COLS + x];
      const a = from.attrs[y * COLS + x];
      if (ch === 32 || ch === 0 || (noDunes && y >= 16 && dune.has(a * 256 + ch))) continue;
      s.put(x + dx, y + dy, ch, a);
    }
}

/** The dunes, `top` down, then sand to the screen's bottom. */
function dunes(s: TextScreen, from: TextScreen, top: number): void {
  copy(s, from, 0, 16, COLS, 4, 0, top - 16);
  if (top + 4 < ROWS) s.fill(0, top + 4, COLS - 1, ROWS - 1, attr(6, 14), 177);
}

/** The castle and the pail side by side, the castle's foot on `foot`. */
function castleAndPail(s: TextScreen, from: TextScreen, foot: number): void {
  copy(s, from, 3, 12, 21, 5, 17, foot - 16, true);
  copy(s, from, 61, 13, 15, 4, -16, foot - 16, true);
  // sand banked up under them where the dunes dip
  for (const [x0, x1] of [
    [22, 40],
    [46, 59],
  ])
    for (let x = x0; x <= x1; x++) for (let y = foot + 1; y < ROWS && s.attrs[y * COLS + x] !== attr(6, 14); y++) s.put(x, y, 177, attr(6, 14));
}

/** A sprinkle of stars in a dark sky, rows `y0` to `y1`. */
function stars(s: TextScreen, y0: number, y1: number): void {
  for (let i = 0; i < 26; i++) {
    const x = 14 + ((i * 37) % 52);
    const y = y0 + ((i * 7) % (y1 - y0 + 1));
    s.put(x, y, i % 3 ? 250 : 249, attr(i % 4 ? 8 : 15, 0));
  }
}

/** Text at its own position on a row, in one attribute. */
function write(s: TextScreen, y: number, a: number, text: string): void {
  const t = toCp437(text);
  s.write(Math.floor((COLS - t.length) / 2), y, a, t);
}

const LOOKS: Record<BbsDesignId, Look> = {
  scene: {
    ring: VGA.yellow,
    edge: VGA.yellow,
    tail: VGA.brown,
    scene: (s) => {
      const from = login();
      stars(s, 8, 13);
      centered(s, 10, '|14Grab a pail and play in the sand!');
      dunes(s, from, 18);
      castleAndPail(s, from, 18);
    },
    title: (s) => copy(s, login(), 0, 2, COLS, 7, 0, -2),
    titleY: 46,
    scroll: '|141-412-555-SAND |08· |1114,400 bps',
  },
  logo: {
    ring: VGA.cyan,
    edge: VGA.cyan,
    tail: '#00aaaa',
    scene: (s) => {
      stars(s, 8, 9);
      centered(s, 11, '|14Pittsburgh, PA');
      centered(s, 12, '|1114,400 bps |08· |07open 24 hours');
      centered(s, 14, '|11Game-Maker shareware');
      centered(s, 15, '|11Designer tips |08· |11Bulletins');
      dunes(s, login(), 19);
    },
    title: (s) => copy(s, login(), 0, 2, COLS, 7, 0, -2),
    titleY: 46,
    scroll: '|07Call |151-412-555-SAND',
  },
  banner: {
    ring: VGA.cyan,
    edge: VGA.cyan,
    tail: '#00aaaa',
    scene: (s) => {
      // a sunset in bands over the dunes, the castle and the pail
      [1, 1, 5, 5, 4, 4, 12, 12, 6, 6, 14, 14].forEach((c, y) => s.fill(0, y, COLS - 1, y, attr(c, 0), 219));
      const from = login();
      for (let y = 12; y < 18; y++) s.fill(0, y, COLS - 1, y, attr(0, 0));
      stars(s, 12, 13);
      dunes(s, from, 18);
      castleAndPail(s, from, 18);
    },
    title: (s) => {
      s.box(8, 0, 71, 4, attr(11, 0), 2);
      centered(s, 1, `|07THE ${SANDBOX_ANSI} |07BBS`);
      centered(s, 3, '|14 1-412-555-SAND |08· |1114,400 baud');
    },
    titleY: 132,
    scroll: '|14Pittsburgh, PA |08· |07open 24 hours',
  },
  gm: {
    ring: VGA.blue,
    edge: VGA.yellow,
    tail: VGA.brown,
    scene: (s) => {
      // Game-Maker's desktop: its title bar and menu, and a window
      s.fill(0, 0, COLS - 1, ROWS - 1, attr(9, 1), 176);
      s.fill(0, 3, COLS - 1, 3, attr(15, 4));
      write(s, 3, attr(14, 4), 'G A M E - M A K E R   SE 3.00');
      s.fill(0, 4, COLS - 1, 4, attr(15, 1));
      let x = 24;
      ['Play', 'Design', 'Utilities', 'About'].forEach((m, i) => {
        s.write(x, 4, i === 1 ? attr(0, 7) : attr(15, 1), ` ${m} `);
        x += m.length + 3;
      });
      s.fill(25, 16, 54, 20, attr(15, 1));
      s.box(25, 16, 54, 20, attr(15, 1), 2);
      write(s, 17, attr(14, 1), 'Make your own');
      write(s, 18, attr(14, 1), 'computer games!');
      write(s, 19, attr(10, 1), 'No programming');
    },
    title: (s) => {
      bigText(s, Math.floor((COLS - bigTextWidth('GAME-MAKER')) / 2), 0, 'GAME-MAKER', [14, 14, 14, 6, 6]);
      centered(s, 7, '|11S A N D B O X   E D I T I O N');
    },
    titleY: 118,
    scroll: '|15Sandbox Edition |08· |07shareware',
  },
};

/** A screen drawn by `draw` as pixels, `rows` tall. */
function screenPixels(draw: (s: TextScreen) => void, rows = ROWS): Rgba {
  const s = new TextScreen(document.createElement('canvas'));
  s.destroy();
  s.clear(attr(7, 0));
  s.cursorVisible = false;
  draw(s);
  s.renderNow();
  const c = document.createElement('canvas');
  c.width = COLS * 8;
  c.height = rows * 16;
  const g = c.getContext('2d')!;
  g.drawImage(s.canvas, 0, 0, c.width, c.height, 0, 0, c.width, c.height);
  return { width: c.width, height: c.height, data: new Uint32Array(g.getImageData(0, 0, c.width, c.height).data.buffer) };
}

/** Lettering lifted off its black: black made see-through, trimmed to what's left. */
function lift(p: Rgba): Rgba {
  const black = rgb(VGA.black) >>> 0;
  const out = blank(p.width, p.height);
  for (let i = 0; i < p.data.length; i++) out.data[i] = p.data[i] === black ? 0 : p.data[i];
  return trimSprite(out) ?? out;
}

/** Lettering on a black ribbon with its top at `y`, as wide as it needs (and at least across the ring). */
function onRibbon(out: Rgba, letters: Rgba, y: number, min: number, look: Look): void {
  const pad = 8;
  const w = Math.min(W - 2 * TAIL - 8, Math.max(letters.width + 3 * pad, min));
  ribbon(out, Math.round(CX - w / 2), Math.round(CX + w / 2), y, y + letters.height + 2 * pad, rgb(VGA.black), rgb(look.edge), rgb(look.tail));
  stamp(out, letters, Math.round(CX - letters.width / 2), y + pad);
}

/** A BBS design's badge, W x H, see-through round it. */
export function bbsBadge(id: BbsDesignId): HTMLCanvasElement {
  const look = LOOKS[id];
  const out = blank(W, H);
  const scene = screenPixels(look.scene);
  const black = rgb(VGA.black) >>> 0;
  medallion(
    out,
    CX,
    CY,
    PIC_R,
    [
      [PIC_R + 3, black],
      [PIC_R + 5, rgb(VGA.gray)],
      [RING - 2, rgb(look.ring)],
      [RING, OUTLINE],
    ],
    (dx, dy) => {
      const x = scene.width / 2 + dx;
      const y = CY + dy - SCENE_Y;
      return x >= 0 && y >= 0 && x < scene.width && y < scene.height ? scene.data[y * scene.width + x] : black;
    },
  );
  const title = lift(screenPixels(look.title));
  onRibbon(out, title, look.titleY, 2 * RING + 24, look);
  const scroll = lift(screenPixels((s) => centered(s, 0, look.scroll), 1));
  onRibbon(out, scroll, CY + RING - 40, 0, look);
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  const img = g.createImageData(W, H);
  new Uint32Array(img.data.buffer).set(out.data);
  g.putImageData(img, 0, 0);
  return c;
}

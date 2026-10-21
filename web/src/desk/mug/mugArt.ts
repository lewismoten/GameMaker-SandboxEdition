// The pictures that can go on the Sandbox BBS mug, drawn the way the board drew them: real
// CP437 characters in the 16 text-mode colors, from the BBS's own ANSI art (retro/ansiArt.ts).
// Each design is a block of 80-column text rendered with the VGA font, 8 x 16 pixels a cell.
import { TextScreen, attr, COLS } from '../../retro/textScreen';
import { SANDBOX_ANSI, bigText, bigTextWidth, centered, fadeBar, sandboxLogin } from '../../retro/ansiArt';
import { toCp437 } from '../../retro/cp437';

export type MugDesignId = 'logo' | 'scene' | 'banner' | 'gm';

export interface MugDesign {
  id: MugDesignId;
  name: string;
  note: string;
}

export const MUG_DESIGNS: MugDesign[] = [
  { id: 'scene', name: 'Logon screen', note: 'The sand castle, the pail and the dunes' },
  { id: 'logo', name: 'SANDBOX logo', note: 'Big block letters, a color for each' },
  { id: 'banner', name: 'BBS banner', note: 'THE -= S A N D B O X =- BBS 1-412-555-SAND' },
  { id: 'gm', name: 'Game-Maker SE', note: 'The Game-Maker title in text mode' },
];

/** The background every design sits on (text-mode black), for the parts of the wrap it doesn't cover. */
export const DESIGN_BG = '#000000';

const CW = 8;
const CH = 16;

/** Rows of the 80-column screen each design takes, top to bottom. */
function compose(s: TextScreen, id: MugDesignId): number {
  s.clear(attr(7, 0));
  s.cursorVisible = false;
  if (id === 'scene' || id === 'logo') {
    // the logon screen, then the pieces we want of it
    const login = new TextScreen(document.createElement('canvas'));
    login.destroy();
    sandboxLogin(login);
    const copy = (fromRow: number, toRow: number, rows: number) => {
      for (let r = 0; r < rows; r++)
        for (let x = 0; x < COLS; x++) s.put(x, toRow + r, login.chars[(fromRow + r) * COLS + x], login.attrs[(fromRow + r) * COLS + x]);
    };
    if (id === 'scene') {
      copy(0, 0, 9); // fade bar, SANDBOX, THE -= S A N D B O X =- BBS
      copy(12, 9, 8); // castle, pail and dunes
      centered(s, 10, '|141-412-555-SAND');
      centered(s, 11, '|0714,400 bps');
      fadeBar(s, 17, 6);
      return 18;
    }
    fadeBar(s, 0, 6);
    copy(2, 2, 7);
    centered(s, 10, '|14Pittsburgh, PA |08· |1114,400 bps |08· |07open 24 hours');
    centered(s, 11, '|07Call |151-412-555-SAND');
    fadeBar(s, 13, 6);
    return 14;
  }
  if (id === 'banner') {
    fadeBar(s, 0, 6);
    s.box(8, 2, 71, 6, attr(11, 0), 2);
    centered(s, 3, `|07THE ${SANDBOX_ANSI} |07BBS`);
    centered(s, 5, '|14 1-412-555-SAND |08· |1114,400 baud');
    fadeBar(s, 8, 6);
    return 9;
  }
  // Game-Maker SE: its title bar and menu, then the name in block letters
  fadeBar(s, 0, 1);
  s.fill(0, 1, COLS - 1, 1, attr(15, 4));
  const title = toCp437('G A M E - M A K E R   SE 3.00');
  s.write(Math.floor((COLS - title.length) / 2), 1, attr(14, 4), title);
  s.fill(0, 2, COLS - 1, 2, attr(15, 1));
  let x = 6;
  ['Play', 'Design', 'Utilities', 'About', 'Quit', 'Help'].forEach((m, i) => {
    s.write(x, 2, i === 1 ? attr(0, 7) : attr(15, 1), ` ${m} `);
    x += m.length + 6;
  });
  bigText(s, Math.floor((COLS - bigTextWidth('GAME-MAKER')) / 2), 5, 'GAME-MAKER', [14, 14, 14, 6, 6]);
  centered(s, 11, '|11S A N D B O X   E D I T I O N');
  centered(s, 12, '|07Make your own computer games! |08· |10No programming');
  fadeBar(s, 14, 1);
  return 15;
}

const cache = new Map<MugDesignId, HTMLCanvasElement>();

/** A design at the VGA font's own size: 640 pixels wide, 16 pixels a row. */
export function designCanvas(id: MugDesignId): HTMLCanvasElement {
  const hit = cache.get(id);
  if (hit) return hit;
  const s = new TextScreen(document.createElement('canvas'));
  s.destroy();
  const rows = compose(s, id);
  s.renderNow();
  const out = document.createElement('canvas');
  out.width = COLS * CW;
  out.height = rows * CH;
  out.getContext('2d')!.drawImage(s.canvas, 0, 0, out.width, out.height, 0, 0, out.width, out.height);
  cache.set(id, out);
  return out;
}

export function isDesign(id: string | null | undefined): id is MugDesignId {
  return MUG_DESIGNS.some((d) => d.id === id);
}

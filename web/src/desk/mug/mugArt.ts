// The pictures that can go on the mug. The BBS's are drawn the way the board drew them: real
// CP437 characters in the 16 text-mode colors, from its own ANSI art (retro/bbs/ansiArt.ts),
// each a block of 80-column text rendered with the VGA font, 8 x 16 pixels a cell. Each
// Sandbox Software game's is its title screen and hero, from the game's files (gameMugArt.ts).
import { TextScreen, attr, COLS } from '../../retro/text/textScreen';
import { SANDBOX_ANSI, bigText, bigTextWidth, centered, fadeBar, sandboxLogin } from '../../retro/bbs/ansiArt';
import { toCp437 } from '../../retro/text/cp437';
import { GAME_ART_H, GAME_ART_W, GAME_MUGS, gameMugArt } from './gameMugArt';

type BbsDesignId = 'logo' | 'scene' | 'banner' | 'gm';
/** A BBS design, or `game-<id>` for a Sandbox Software game's. */
export type MugDesignId = BbsDesignId | `game-${string}`;

export interface MugDesign {
  id: MugDesignId;
  name: string;
  note: string;
  group: 'bbs' | 'game';
}

const GAME_NAMES: Record<string, [name: string, hero: string]> = {
  maximus: ['Maximus', 'Courier Max'],
  teddy: ['Teddy’s Little Big Adventure', 'Teddy the corgi'],
  year2000: ['In The Year 2000!', 'Dex Dynamo'],
  blaster: ['Virus Blaster', 'the BLASTER nano-fighter'],
  logic: ['Ohm Sweet Ohm', 'Watt the repair robot'],
  sleuth: ['Final Curtain', 'Inspector Ada Penn'],
  snowbound: ['Snowbound', 'the kid with the shovel'],
  sandcast: ['Sandcastle Knight', 'Teddy in his tin helmet'],
};

export const MUG_DESIGNS: MugDesign[] = [
  { id: 'scene', name: 'Logon screen', note: 'The sand castle, the pail and the dunes', group: 'bbs' },
  { id: 'logo', name: 'SANDBOX logo', note: 'Big block letters, a color for each', group: 'bbs' },
  { id: 'banner', name: 'BBS banner', note: 'THE -= S A N D B O X =- BBS 1-412-555-SAND', group: 'bbs' },
  { id: 'gm', name: 'Game-Maker SE', note: 'The Game-Maker title in text mode', group: 'bbs' },
  ...GAME_MUGS.map(([game]): MugDesign => {
    const [name, hero] = GAME_NAMES[game] ?? [game, 'its hero'];
    return { id: `game-${game}`, name, note: `Its title screen, with ${hero}`, group: 'game' };
  }),
];

const CW = 8;
const CH = 16;

/** Rows of the 80-column screen each design takes, top to bottom. */
function compose(s: TextScreen, id: BbsDesignId): number {
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
const loading = new Map<MugDesignId, Promise<HTMLCanvasElement>>();

const gameOf = (id: MugDesignId): [string, string] | undefined => GAME_MUGS.find(([g]) => `game-${g}` === id);

/** A game's picture while its files load (or if they can't): its name on black. */
function placeholder(id: MugDesignId): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = GAME_ART_W;
  c.height = GAME_ART_H;
  const g = c.getContext('2d')!;
  g.fillStyle = '#000';
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#ffd23f';
  g.font = 'bold 22px Arial, sans-serif';
  g.textAlign = 'center';
  g.fillText(MUG_DESIGNS.find((d) => d.id === id)?.name ?? id, c.width / 2, c.height / 2);
  return c;
}

/**
 * A design's picture: a BBS design at the VGA font's own size (640 pixels wide, 16 a row), a
 * game's 320 x 248. A game's is a stand-in until loadDesign() has fetched its files.
 */
export function designCanvas(id: MugDesignId): HTMLCanvasElement {
  const hit = cache.get(id);
  if (hit) return hit;
  if (gameOf(id)) return placeholder(id);
  const s = new TextScreen(document.createElement('canvas'));
  s.destroy();
  const rows = compose(s, id as BbsDesignId);
  s.renderNow();
  const out = document.createElement('canvas');
  out.width = COLS * CW;
  out.height = rows * CH;
  out.getContext('2d')!.drawImage(s.canvas, 0, 0, out.width, out.height, 0, 0, out.width, out.height);
  cache.set(id, out);
  return out;
}

/** A design's picture once it is ready (a game's comes from its files on the CD). */
export function loadDesign(id: MugDesignId): Promise<HTMLCanvasElement> {
  const game = gameOf(id);
  if (!game || cache.has(id)) return Promise.resolve(designCanvas(id));
  let p = loading.get(id);
  if (!p) {
    p = gameMugArt(...game)
      .catch(() => undefined)
      .then((art) => {
        if (!art) return (loading.delete(id), placeholder(id)); // try again next time
        cache.set(id, art);
        return art;
      });
    loading.set(id, p);
  }
  return p;
}

/** Every design's picture, ready. */
export function loadDesigns(): Promise<HTMLCanvasElement[]> {
  return Promise.all(MUG_DESIGNS.map((d) => loadDesign(d.id)));
}

export function isDesign(id: string | null | undefined): id is MugDesignId {
  return MUG_DESIGNS.some((d) => d.id === id);
}

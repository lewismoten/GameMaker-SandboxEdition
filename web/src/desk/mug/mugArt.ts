// The pictures that can go on the mug, each a round badge, see-through round it so the mug's
// white shows. The BBS's are drawn the way the board drew them, real CP437 characters in the 16
// text-mode colors from its own ANSI art (bbsBadge.ts); each Sandbox Software game's is made
// from its title screen and hero, from the game's files (gameMugArt.ts).
import { bbsBadge, type BbsDesignId } from './bbsBadge';
import { GAME_ART_H, GAME_ART_W, GAME_MUGS, gameMugArt, type GameMug } from './gameMugArt';

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
  ...GAME_MUGS.map(({ game }): MugDesign => {
    const [name, hero] = GAME_NAMES[game] ?? [game, 'its hero'];
    return { id: `game-${game}`, name, note: `A badge from its title screen, with ${hero}`, group: 'game' };
  }),
];

const cache = new Map<MugDesignId, HTMLCanvasElement>();
const loading = new Map<MugDesignId, Promise<HTMLCanvasElement>>();

const gameOf = (id: MugDesignId): GameMug | undefined => GAME_MUGS.find((m) => `game-${m.game}` === id);

/** A game's picture while its files load (or if they can't): its name on a dark disc where the badge goes. */
function placeholder(id: MugDesignId): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = GAME_ART_W;
  c.height = GAME_ART_H;
  const g = c.getContext('2d')!;
  g.fillStyle = '#000';
  g.beginPath();
  g.arc(c.width / 2, c.height / 2, Math.min(c.width, c.height) / 2 - 4, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#ffd23f';
  g.font = 'bold 22px Arial, sans-serif';
  g.textAlign = 'center';
  g.fillText(MUG_DESIGNS.find((d) => d.id === id)?.name ?? id, c.width / 2, c.height / 2, c.width * 0.6);
  return c;
}

/**
 * A design's picture: a BBS design's badge at the VGA font's own size (640 pixels wide), a
 * game's GAME_ART_W x GAME_ART_H. A game's is a stand-in until loadDesign() has fetched its files.
 */
export function designCanvas(id: MugDesignId): HTMLCanvasElement {
  const hit = cache.get(id);
  if (hit) return hit;
  if (gameOf(id)) return placeholder(id);
  const out = bbsBadge(id as BbsDesignId);
  cache.set(id, out);
  return out;
}

/** A design's picture once it is ready (a game's comes from its files on the CD). */
export function loadDesign(id: MugDesignId): Promise<HTMLCanvasElement> {
  const game = gameOf(id);
  if (!game || cache.has(id)) return Promise.resolve(designCanvas(id));
  let p = loading.get(id);
  if (!p) {
    p = gameMugArt(game)
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

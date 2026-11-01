// The pictures that can go on the mug, each a round badge, see-through round it so the mug's
// white shows. The BBS's are drawn the way the board drew them, real CP437 characters in the 16
// text-mode colors from its own ANSI art (bbsBadge.ts); each Sandbox Software game's is made
// from its title screen and hero, from the game's files (gameMugArt.ts).
import { bbsBadge, type BbsDesignId } from './bbsBadge';
import { bardLogoArt } from './bardLogoArt';
import { GAME_ART_H, GAME_ART_W, GAME_MUGS, gameMugArt, type GameMug } from './gameMugArt';

/** A BBS design, or `game-<id>` for a Sandbox Software game's. */
export type MugDesignId = BbsDesignId | `game-${string}` | 'bard-logo';

export interface MugDesign {
  id: MugDesignId;
  name: string;
  note: string;
  group: 'bbs' | 'game' | 'bizarre';
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
  brief: ['Keep It Brief!', 'Joe the library robot'],
  depth: ['Depth Perception', 'a chrome sphere'],
  realm: ['Quest for the Round Tuit', 'Pip in her red cap'],
  teddy2: ['Teddy’s Little Bigger Adventure', 'Teddy the corgi'],
  teddy3: ['Teddy’s Little Biggest Adventure', 'Teddy the corgi'],
  tuneup: ['Tune-Up', 'Doc Leo'],
  goat: ['Third Goat from the Left', 'the goat'],
  mustard: ['Mustard Seed Hustle', 'no hero, just the sprout'],
  needle: ['Thread the Needle, Brother Camel', 'no hero, its title across the bottom'],
  loaf: ['Loaf #13', 'the loaf'],
  carl: ['A Fly Named Carl', 'Carl the fly'],
  remote: ['Where’s the Remote?!', 'the remote'],
  reckoning: ['The Great Dairy Reckoning', 'Doc Leo'],
  loofah: ['Cleanse Me, O Loofah', 'the loofah'],
  smirked: ['I Screamed, She Smirked', 'the smirking girl'],
  tickle: ['Certified Rat Tickler', 'Doc Leo'],
  sweats: ['Shakespeare in Sweatpants', 'the poet'],
  risi: ['Veni, Vidi, Risi!', 'the poet in a toga'],
};

export const MUG_DESIGNS: MugDesign[] = [
  { id: 'scene', name: 'Logon screen', note: 'The sand castle, the pail and the dunes', group: 'bbs' },
  { id: 'logo', name: 'SANDBOX logo', note: 'Big block letters, a color for each', group: 'bbs' },
  { id: 'banner', name: 'BBS banner', note: 'THE -= S A N D B O X =- BBS 1-412-555-SAND', group: 'bbs' },
  { id: 'gm', name: 'Game-Maker SE', note: 'The Game-Maker title in text mode', group: 'bbs' },
  ...GAME_MUGS.map(({ game, bizarre }): MugDesign => {
    const [name, hero] = GAME_NAMES[game] ?? [game, 'its hero'];
    return { id: `game-${game}`, name, note: `A badge from its title screen, with ${hero}`, group: bizarre ? 'bizarre' : 'game' };
  }),
  { id: 'bard-logo', name: 'The Bard of Bizarre logo', note: 'The rooster in spectacles above the lettering (logo made with DeepAI)', group: 'bizarre' },
];

const cache = new Map<MugDesignId, HTMLCanvasElement>();
const loading = new Map<MugDesignId, Promise<HTMLCanvasElement>>();

const isLogo = (id: MugDesignId) => id === 'bard-logo';
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
  if (gameOf(id) || isLogo(id)) return placeholder(id);
  const out = bbsBadge(id as BbsDesignId);
  cache.set(id, out);
  return out;
}

/** A design's picture once it is ready (a game's comes from its files on the CD). */
export function loadDesign(id: MugDesignId): Promise<HTMLCanvasElement> {
  const game = gameOf(id);
  if ((!game && !isLogo(id)) || cache.has(id)) return Promise.resolve(designCanvas(id));
  let p = loading.get(id);
  if (!p) {
    p = (game ? gameMugArt(game) : bardLogoArt())
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

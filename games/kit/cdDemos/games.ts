// The CD games that shipped without a title demo, and how the bot plays each one.
// Games left out (and why) are listed in SKIPPED.
import type { BotOptions } from './bot';

export interface CdDemoGame {
  id: string;
  kind: 'gameware' | 'shareware';
  gam: string;
  /** Game ticks to record (18.2 a second). */
  ticks?: number;
  bot?: BotOptions;
  /**
   * The game's own recording that its title screen never names: listed as the added demo
   * as it is (nothing recorded here).
   */
  inGame?: string;
}

export const CD_DEMO_GAMES: CdDemoGame[] = [
  { id: 'donut', kind: 'gameware', gam: 'donut.gam' },
  { id: 'glub', kind: 'gameware', gam: 'glub.gam' },
  { id: 'heart', kind: 'gameware', gam: 'heart.gam' },
  { id: 'outerlim', kind: 'gameware', gam: 'outerg.gam' },
  { id: 'penguin', kind: 'gameware', gam: 'penguin.gam' },
  { id: 'rings5', kind: 'gameware', gam: 'quest.gam' },
  { id: 'sample', kind: 'gameware', gam: 'sample.gam' },
  { id: 'terrain', kind: 'gameware', gam: 'terrain.gam' },
  { id: 'warrior', kind: 'gameware', gam: 'warrior.gam' },
  { id: 'houses', kind: 'gameware', gam: 'houses.gam', inGame: 'houses.rec' },
  { id: 'ajqst2', kind: 'shareware', gam: 'demo.gam' },
  { id: 'ajquest', kind: 'shareware', gam: 'a_j.gam' },
  { id: 'bounerm', kind: 'shareware', gam: 'bounerim.gam' },
  { id: 'congress', kind: 'shareware', gam: 'congress.gam' },
  { id: 'fluffyr', kind: 'shareware', gam: 'ralph.gam' },
  { id: 'gridlin', kind: 'shareware', gam: 'gridline.gam' },
  { id: 'njlnflx', kind: 'shareware', gam: 'nejilian.gam' },
  { id: 'octolrs', kind: 'shareware', gam: 'octolris.gam' },
  { id: 'orb', kind: 'shareware', gam: 'orb.gam' },
  { id: 'pac', kind: 'shareware', gam: 'pac.gam' },
  { id: 'paperair', kind: 'shareware', gam: 'spap.gam' },
  { id: 'parsec3d', kind: 'shareware', gam: 'parsec3d.gam' },
  { id: 'signhdg', kind: 'shareware', gam: 'sign.gam' },
  { id: 'zoom', kind: 'shareware', gam: 'zoom_.gam' },
];

/** CD entries with no demo that get none, and why. */
export const SKIPPED: Record<string, string> = {
  library: 'a parts library: no game file to play',
};

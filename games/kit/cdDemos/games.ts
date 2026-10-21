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
  /** Bot runs to try for one that holds up under other monster dice (default 4). */
  attempts?: number;
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
  { id: 'outerlim', kind: 'gameware', gam: 'outerg.gam', bot: { links: 'any' } },
  { id: 'penguin', kind: 'gameware', gam: 'penguin.gam' },
  { id: 'rings5', kind: 'gameware', gam: 'quest.gam' },
  { id: 'sample', kind: 'gameware', gam: 'sample.gam' },
  { id: 'terrain', kind: 'gameware', gam: 'terrain.gam' },
  { id: 'warrior', kind: 'gameware', gam: 'warrior.gam', bot: { links: { 7: [1] } } },
  { id: 'houses', kind: 'gameware', gam: 'houses.gam', inGame: 'houses.rec' },
  { id: 'ajqst2', kind: 'shareware', gam: 'demo.gam', bot: { links: { 2: 'any' } } },
  { id: 'ajquest', kind: 'shareware', gam: 'a_j.gam' },
  { id: 'bounerm', kind: 'shareware', gam: 'bounerim.gam' },
  { id: 'congress', kind: 'shareware', gam: 'congress.gam' },
  { id: 'fluffyr', kind: 'shareware', gam: 'ralph.gam' },
  { id: 'gridlin', kind: 'shareware', gam: 'gridline.gam' },
  { id: 'njlnflx', kind: 'shareware', gam: 'nejilian.gam' },
  { id: 'octolrs', kind: 'shareware', gam: 'octolris.gam' },
  { id: 'orb', kind: 'shareware', gam: 'orb.gam', bot: { links: { 6: 'any' } } },
  { id: 'paperair', kind: 'shareware', gam: 'spap.gam' },
  { id: 'parsec3d', kind: 'shareware', gam: 'parsec3d.gam', bot: { links: { 2: [0] } } },
  { id: 'signhdg', kind: 'shareware', gam: 'sign.gam', bot: { links: 'any', every: 2 } },
  { id: 'zoom', kind: 'shareware', gam: 'zoom_.gam' },
];

/** CD entries with no demo that get none, and why. */
export const SKIPPED: Record<string, string> = {
  library: 'a parts library: no game file to play',
  // PAC's ghosts roll new dice in every playback, and a .REC only replays keys: no bot run
  // (eight tries, 400 to 820 ticks) kept PAC alive in more than 3 of 5 replays.
  pac: 'its ghosts chase at random, so a recorded route dies in most playbacks',
};

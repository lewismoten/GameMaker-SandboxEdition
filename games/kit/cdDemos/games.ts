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
   * The monsters roam at random and will catch the hero in most playbacks whatever the
   * route (PLAYGAME seeds rand() from the clock at start, so DOS replays differ too): keep
   * the recording that lasts longest on average. Playback then ends with the game over.
   */
  mayDie?: boolean;
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
  // its title scene names PEACH.REC, which the CD does not have; its DEMO.REC is the author's recording
  { id: 'peach', kind: 'gameware', gam: 'peach.gam', inGame: 'demo.rec' },
  { id: 'outerlim', kind: 'gameware', gam: 'outerg.gam', bot: { links: 'any' } },
  { id: 'penguin', kind: 'gameware', gam: 'penguin.gam' },
  { id: 'rings5', kind: 'gameware', gam: 'quest.gam' },
  { id: 'sample', kind: 'gameware', gam: 'sample.gam' },
  { id: 'terrain', kind: 'gameware', gam: 'terrain.gam' },
  { id: 'warrior', kind: 'gameware', gam: 'warrior.gam', ticks: 1000, bot: { links: { 7: [1], 2: 'any', 3: 'any' }, every: 2 } },
  { id: 'houses', kind: 'gameware', gam: 'houses.gam', inGame: 'houses.rec' },
  { id: 'ajqst2', kind: 'shareware', gam: 'demo.gam', ticks: 1000, bot: { links: { 2: [3] }, every: 2, horizon: 30 } },
  { id: 'ajquest', kind: 'shareware', gam: 'a_j.gam' },
  { id: 'bounerm', kind: 'shareware', gam: 'bounerim.gam', ticks: 1000, bot: { links: 'any', every: 2, horizon: 30 } },
  { id: 'congress', kind: 'shareware', gam: 'congress.gam' },
  { id: 'fluffyr', kind: 'shareware', gam: 'ralph.gam' },
  { id: 'gridlin', kind: 'shareware', gam: 'gridline.gam', ticks: 1000, bot: { links: 'any', every: 2 } },
  { id: 'njlnflx', kind: 'shareware', gam: 'nejilian.gam' },
  { id: 'octolrs', kind: 'shareware', gam: 'octolris.gam' },
  { id: 'orb', kind: 'shareware', gam: 'orb.gam', ticks: 1000, bot: { links: 'any', every: 2 } },
  { id: 'pac', kind: 'shareware', gam: 'pac.gam', ticks: 500, attempts: 6, mayDie: true },
  { id: 'paperair', kind: 'shareware', gam: 'spap.gam', ticks: 1000, bot: { links: { 2: 'any', 3: 'any', 4: [0], 5: 'any', 6: 'any', 7: 'any' }, every: 2 } },
  { id: 'parsec3d', kind: 'shareware', gam: 'parsec3d.gam', bot: { links: { 2: [0] } } },
  { id: 'signhdg', kind: 'shareware', gam: 'sign.gam', ticks: 1100, bot: { links: 'any', every: 2 } },
  { id: 'zoom', kind: 'shareware', gam: 'zoom_.gam', ticks: 1000, bot: { links: 'any', every: 2 } },
];

/** CD entries with no demo that get none, and why. */
export const SKIPPED: Record<string, string> = {
  library: 'a parts library: no game file to play',
};

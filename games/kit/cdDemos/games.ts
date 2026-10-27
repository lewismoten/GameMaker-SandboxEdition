// The CD games that shipped without a title demo, and how the bot plays each one.
// Games left out (and why) are listed in SKIPPED.
import type { BotOptions } from './bot';

interface CdDemoGame {
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
  {
    id: 'ajqst2',
    kind: 'shareware',
    gam: 'demo.gam',
    ticks: 1000,
    attempts: 2,
    bot: {
      links: { 2: [3] },
      every: 2,
      horizon: 30,
      searchRoute: true,
      route: {
        12: [
          { x: 62, y: 80 },
          { x: 70, y: 80 },
          { x: 73, y: 72 },
          { x: 80, y: 79 },
          { x: 86, y: 77 },
          { x: 92, y: 74 },
          { x: 99, y: 76 },
        ],
      },
    },
  },
  { id: 'ajquest', kind: 'shareware', gam: 'a_j.gam' },
  {
    id: 'bounerm',
    kind: 'shareware',
    gam: 'bounerim.gam',
    ticks: 1000,
    attempts: 2,
    bot: {
      links: 'any',
      every: 2,
      horizon: 30,
      goalWeight: 30,
      searchRoute: true,
      route: {
        2: [
          { x: 10, y: 2 },
          { x: 11, y: 1 },
          { x: 12, y: 0 },
          { x: 13, y: 99 },
          { x: 16, y: 0 },
          { x: 25, y: 1 },
          { x: 34, y: 2 },
          { x: 33, y: 5 },
          { x: 32, y: 7 },
          { x: 42, y: 8 },
          { x: 50, y: 9 },
          { x: 55, y: 14 },
          { x: 57, y: 20 },
          { x: 57, y: 27 },
        ],
      },
    },
  },
  { id: 'congress', kind: 'shareware', gam: 'congress.gam' },
  { id: 'fluffyr', kind: 'shareware', gam: 'ralph.gam' },
  {
    id: 'gridlin',
    kind: 'shareware',
    gam: 'gridline.gam',
    ticks: 1000,
    attempts: 2,
    bot: {
      links: 'any',
      every: 2,
      searchRoute: true,
      route: {
        2: [
          { x: 33, y: 30 },
          { x: 40, y: 27 },
          { x: 46, y: 26 },
          { x: 48, y: 26 },
        ],
      },
    },
  },
  { id: 'njlnflx', kind: 'shareware', gam: 'nejilian.gam' },
  { id: 'octolrs', kind: 'shareware', gam: 'octolris.gam' },
  { id: 'orb', kind: 'shareware', gam: 'orb.gam', ticks: 1000, bot: { links: 'any', every: 2 } },
  { id: 'pac', kind: 'shareware', gam: 'pac.gam', ticks: 500, attempts: 6, mayDie: true },
  {
    id: 'paperair',
    kind: 'shareware',
    gam: 'spap.gam',
    ticks: 1000,
    attempts: 2,
    bot: {
      links: { 2: 'any', 3: 'any', 4: [0], 5: 'any', 6: 'any', 7: 'any' },
      every: 2,
      searchRoute: true,
      route: {
        2: [
          { x: 40, y: 80 },
          { x: 60, y: 80 },
          { x: 86, y: 80 },
          { x: 89, y: 78 },
          { x: 89, y: 64 },
          { x: 80, y: 65 },
          { x: 77, y: 60 },
          { x: 77, y: 47 },
        ],
      },
    },
  },
  { id: 'parsec3d', kind: 'shareware', gam: 'parsec3d.gam', bot: { links: { 2: [0] } } },
  {
    id: 'signhdg',
    kind: 'shareware',
    gam: 'sign.gam',
    ticks: 1100,
    bot: {
      links: 'any',
      every: 2,
      searchRoute: true,
      route: {
        5: [
          { x: 18, y: 66 },
          { x: 23, y: 61 },
          { x: 23, y: 62 },
        ],
      },
    },
  },
  {
    id: 'zoom',
    kind: 'shareware',
    gam: 'zoom_.gam',
    ticks: 1800,
    attempts: 5,
    bot: {
      links: 'any',
      every: 2,
      goalWeight: 30,
      keepAway: 3,
      searchRoute: true,
      route: {
        3: [
          { x: 10, y: 43 },
          { x: 14, y: 36 },
          { x: 14, y: 25 },
          { x: 15, y: 17 },
          { x: 20, y: 12 },
          { x: 30, y: 9 },
          { x: 40, y: 10 },
          { x: 45, y: 17 },
          { x: 52, y: 21 },
          { x: 57, y: 15 },
          { x: 60, y: 7 },
          { x: 66, y: 8 },
          { x: 68, y: 14 },
          { x: 76, y: 14 },
          { x: 84, y: 12 },
        ],
      },
    },
  },
];

// The CD's parts library gets no demo: it has no game file to play.

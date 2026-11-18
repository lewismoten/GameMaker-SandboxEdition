// The arrival lesson catalog in its original block-registration order.
import type { Nod } from './types';
import { ladder } from './ladder';
import { keyGate } from './keyGate';
import { coins } from './coins';
import { crates } from './crates';
import { heart } from './heart';
import { ice } from './ice';
import { wind } from './wind';
import { hop } from './hop';
import { bug } from './bug';
import { flock } from './flock';
import { say } from './say';
import { pads } from './pads';
import { countdown } from './countdown';
import { lever } from './lever';
import { tokens } from './tokens';
import { fakeWall } from './fakeWall';
import { shore } from './shore';
import { stars } from './stars';
import { popups } from './popups';

export const NODS: Record<string, Nod> = {
  ladder,
  keyGate,
  coins,
  crates,
  heart,
  ice,
  wind,
  hop,
  bug,
  flock,
  say,
  pads,
  countdown,
  lever,
  tokens,
  fakeWall,
  shore,
  stars,
  popups,
};

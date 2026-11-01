// The bot's whole game on the built disk, level after level, without losing a life, ending
// at the bandstand (check.ts and walkthrough.ts run it).
import { playLevels } from '../../kit/levelRun';
import { Bot } from './bot';
import {
  theArcade,
  theBandstand,
  theBandstand1,
  theBandstand2,
  theMarchingField,
  theMusicStore,
  theRollerRink,
  thePianoShop,
  thePlayerPiano,
  theWoods,
} from './route';
import { theAttic, theBasement, theChoirLoft, theClockTower, theFarm, theSoundCheck } from './route2';
import { GameSim } from './sim';

export const SEED = 1;
const LEVELS = [
  thePianoShop,
  thePlayerPiano,
  theBandstand1,
  theMusicStore,
  theBandstand2,
  theChoirLoft,
  theBandstand(8, 4),
  theBasement,
  theBandstand(10, 7),
  theArcade,
  theBandstand(12, 7),
  theRollerRink,
  theBandstand(14, 6),
  theMarchingField,
  theBandstand(16, 5),
  theWoods,
  theBandstand(18, 6),
  theClockTower,
  theBandstand(20, 10),
  theFarm,
  theBandstand(22, 6),
  theAttic,
  theBandstand(24, 9),
  theSoundCheck,
  theBandstand(26, 5),
];

export async function play(seed = SEED, upTo = LEVELS.length): Promise<{ sim: GameSim; bot: Bot }> {
  const sim = new GameSim(undefined, seed);
  const bot = new Bot(sim, seed);
  await playLevels(bot, LEVELS, upTo);
  return { sim, bot };
}

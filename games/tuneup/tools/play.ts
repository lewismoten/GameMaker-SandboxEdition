// The bot's whole game on the built disk, level after level, without losing a life, ending
// at the bandstand (check.ts and walkthrough.ts run it).
import { playLevels } from '../../kit/levelRun';
import { Bot } from './bot';
import {
  theArcade,
  theBandstand1,
  theBandstand2,
  theBandstand3,
  theBandstand4,
  theBandstand5,
  theBandstand6,
  theMarchingField,
  theMusicStore,
  theRollerRink,
  thePianoShop,
  thePlayerPiano,
  theWoods,
} from './route';
import { GameSim } from './sim';

export const SEED = 1;
const LEVELS = [
  thePianoShop,
  thePlayerPiano,
  theBandstand1,
  theMusicStore,
  theBandstand2,
  theArcade,
  theBandstand3,
  theRollerRink,
  theBandstand4,
  theMarchingField,
  theBandstand5,
  theWoods,
  theBandstand6,
];

export async function play(seed = SEED, upTo = LEVELS.length): Promise<{ sim: GameSim; bot: Bot }> {
  const sim = new GameSim(undefined, seed);
  const bot = new Bot(sim, seed);
  await playLevels(bot, LEVELS, upTo);
  return { sim, bot };
}

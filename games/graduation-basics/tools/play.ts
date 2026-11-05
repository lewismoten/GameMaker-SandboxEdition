// The bot's whole game on the built disk, ending at the certificate (check.ts, walkthrough.ts and gendemo.ts run it).
import { aisle, makePlay } from '../../kit/starter/graduationTools';
import { GameSim } from './sim';

export const play = makePlay(GameSim, [aisle]);

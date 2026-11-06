// The bot's whole game on the built disk, ending at the certificate (check.ts, walkthrough.ts and gendemo.ts run it).
import { makePlay } from '../../kit/starter/graduationTools';
import { arrivalRoute } from '../../kit/starter/graduationNodRoutes';
import { cfg } from '../src/config';
import { aisle } from './route';
import { GameSim } from './sim';

export const play = makePlay(GameSim, [arrivalRoute(cfg.arrive.nods), aisle]);

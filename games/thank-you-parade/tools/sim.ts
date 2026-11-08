// The headless player (kit/gameSim.ts, PLAYGAME's play loop on a built disk) pointed at THE THANK-YOU PARADE's disk/.
import { diskSim } from '@lewismoten/gamemaker-sandbox-tools/kit/gameSim';

export const GameSim = diskSim(new URL('../disk', import.meta.url));
export type GameSim = InstanceType<typeof GameSim>;

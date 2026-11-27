// Recognize the unpaid stall attempt during demo playback.
import { ORIGIN } from '../../kit/starter/map';
import type { GameSim } from './sim';

export function unpaidStallBump(before: GameSim['pos'], after: GameSim['pos'], right: boolean, money: number, keys: number): boolean {
  const atStall = (pos: GameSim['pos']) => pos.x === ORIGIN + 15 && pos.y === ORIGIN + 9 && pos.sx === 0 && pos.sy === 0;
  return right && money === 2 && keys === 1 && atStall(before) && atStall(after);
}

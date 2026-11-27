// Plays the recorded key changes on the headless demo checker.
import type { RecordedKey } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import type { GameSim } from './sim';

export async function playDemoKeys(keys: RecordedKey[], sim: Pick<GameSim, 'press' | 'release'>, step: () => Promise<void>): Promise<void> {
  for (const k of keys) {
    for (let i = 0; i < k.delta; i++) await step();
    if (k.key === 1) break; // Escape ends the demo before the key reaches the game.
    if (k.key & 0x80) sim.release(k.key & 0x7f);
    else sim.press(k.key & 0x7f);
  }
}

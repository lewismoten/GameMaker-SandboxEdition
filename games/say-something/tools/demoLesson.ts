// Check the lesson shown during title-demo playback up to the recorded Escape press.
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import type { GameSim } from './sim';

export async function showsLesson(bytes: Uint8Array, sim: Pick<GameSim, 'tick' | 'press' | 'release' | 'trail'>): Promise<boolean> {
  for (const { delta, key } of parseRecording(bytes)) {
    for (let i = 0; i < delta; i++) await sim.tick();
    if (key === 1) return sim.trail.filter((scene) => scene === 4).length === 1;
    const scan = key & 0x7f;
    if (key & 0x80) sim.release(scan);
    else sim.press(scan);
  }
  return false;
}

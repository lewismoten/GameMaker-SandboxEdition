// Selects the Pocket host checker's walkthrough segment on a scene link.
import type { WalkSegment } from '../src/walkthrough/format';

export function nextHostSegment(segments: WalkSegment[], current: number, scene: number): number {
  return segments[current + 1]?.scene === scene ? current + 1 : -1;
}

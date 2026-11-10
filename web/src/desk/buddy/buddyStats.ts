// The desk buddy's small summary: games played, badges earned, the game on the PC now and the
// pose it shows. The card reads it today; it is also the whole of what a slow face (the Pi's
// e-ink status screen, a CYD) would need later. Counts of what was done, never of what is left.
import { loadAchievements } from '../../achievements/store';
import type { Pose } from './buddyLines';

interface BuddySummary {
  played: number;
  badges: number;
  playing?: string;
  pose: Pose;
}

export async function buddySummary(playing: string | undefined, pose: Pose): Promise<BuddySummary> {
  const r = await loadAchievements().catch(() => undefined);
  return { played: r?.sets.played?.length ?? 0, badges: Object.keys(r?.unlocked ?? {}).length, playing, pose };
}
